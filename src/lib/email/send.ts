import { Resend } from "resend";
import { getSiteConfig } from "@/lib/site-config";
import { getEmailSenders, getSenderByKey } from "@/lib/email/senders";
import { emailOptionsFromSiteConfig, wrapEmailHtml } from "@/lib/email/templates";
import {
  resolveRecipients,
  type EmailAudience,
} from "@/lib/email/recipients";
import { prisma } from "@/lib/db";

export type EmailAttachment = {
  filename: string;
  content: string;
  type?: string;
};

export type SendBulkEmailInput = {
  senderKey: string;
  subject: string;
  htmlBody: string;
  audience: EmailAudience;
  customEmails?: string;
  tagIds?: string[];
  sentByEmail: string;
  testOnly?: boolean;
  testEmail?: string;
  attachments?: EmailAttachment[];
};

export type SendBulkEmailResult = {
  recipientCount: number;
  successCount: number;
  failureCount: number;
  errors: string[];
  dryRun: boolean;
};

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENTS_TOTAL_BYTES = 20 * 1024 * 1024;
/** Resend allows 10 requests/sec; stay under that and retry 429s. */
const MIN_SEND_GAP_MS = 125;
const BATCH_SIZE = 100;
const MAX_RATE_LIMIT_RETRIES = 5;

type BulkRecipient = { email: string; label?: string };

type RecipientRecord = {
  email: string;
  name: string | null;
  status: "sent" | "failed";
  error: string | null;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(error: {
  message?: string;
  statusCode?: number | null;
} | null | undefined): boolean {
  if (!error) return false;
  if (error.statusCode === 429) return true;
  const msg = (error.message ?? "").toLowerCase();
  return msg.includes("too many requests") || msg.includes("rate limit");
}

function rateLimitDelayMs(attempt: number) {
  return Math.min(4000, 400 * 2 ** (attempt - 1));
}

function errorMessage(error: unknown, fallback = "Send failed") {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function decodeBase64Size(content: string): number {
  const padded = content.replace(/\s/g, "");
  const padding = padded.endsWith("==") ? 2 : padded.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((padded.length * 3) / 4) - padding);
}

function toResendAttachments(attachments?: EmailAttachment[]) {
  if (!attachments?.length) return undefined;
  if (attachments.length > MAX_ATTACHMENTS) {
    throw new Error(`You can attach up to ${MAX_ATTACHMENTS} files`);
  }
  let total = 0;
  const out = attachments.map((file) => {
    const filename = file.filename?.trim();
    if (!filename || !file.content) {
      throw new Error("Each attachment needs a file name and content");
    }
    const size = decodeBase64Size(file.content);
    if (size > MAX_ATTACHMENT_BYTES) {
      throw new Error(`${filename} is over 8 MB`);
    }
    total += size;
    return {
      filename,
      content: file.content,
      contentType: file.type || undefined,
    };
  });
  if (total > MAX_ATTACHMENTS_TOTAL_BYTES) {
    throw new Error("Attachments are over 20 MB total");
  }
  return out;
}

function emptySendResult() {
  return {
    successCount: 0,
    failureCount: 0,
    errors: [] as string[],
    recipientRecords: [] as RecipientRecord[],
  };
}

function markSent(
  result: ReturnType<typeof emptySendResult>,
  recipient: BulkRecipient,
) {
  result.successCount += 1;
  result.recipientRecords.push({
    email: recipient.email,
    name: recipient.label ?? null,
    status: "sent",
    error: null,
  });
}

function markFailed(
  result: ReturnType<typeof emptySendResult>,
  recipient: BulkRecipient,
  message: string,
) {
  result.failureCount += 1;
  result.errors.push(`${recipient.email}: ${message}`);
  result.recipientRecords.push({
    email: recipient.email,
    name: recipient.label ?? null,
    status: "failed",
    error: message,
  });
}

async function sendOneEmail(
  resend: Resend,
  payload: Parameters<Resend["emails"]["send"]>[0],
) {
  for (let attempt = 1; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
    try {
      const { error } = await resend.emails.send(payload);
      if (isRateLimitError(error) && attempt < MAX_RATE_LIMIT_RETRIES) {
        await sleep(rateLimitDelayMs(attempt));
        continue;
      }
      return { error };
    } catch (err) {
      if (
        isRateLimitError(err as { message?: string; statusCode?: number }) &&
        attempt < MAX_RATE_LIMIT_RETRIES
      ) {
        await sleep(rateLimitDelayMs(attempt));
        continue;
      }
      throw err;
    }
  }
  return { error: { message: "Too many requests", statusCode: 429 } };
}

async function sendOneByOne(
  resend: Resend,
  input: {
    recipients: BulkRecipient[];
    from: string;
    replyTo: string;
    subject: string;
    html: string;
    attachments: ReturnType<typeof toResendAttachments>;
  },
) {
  const result = emptySendResult();
  let lastSendAt = 0;

  for (const recipient of input.recipients) {
    const wait = lastSendAt + MIN_SEND_GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastSendAt = Date.now();

    try {
      const { error } = await sendOneEmail(resend, {
        from: input.from,
        to: recipient.email,
        replyTo: input.replyTo,
        subject: input.subject,
        html: input.html,
        attachments: input.attachments,
      });
      if (error) {
        markFailed(result, recipient, error.message);
      } else {
        markSent(result, recipient);
      }
    } catch (err) {
      markFailed(result, recipient, errorMessage(err));
    }
  }

  return result;
}

async function sendInBatches(
  resend: Resend,
  input: {
    recipients: BulkRecipient[];
    from: string;
    replyTo: string;
    subject: string;
    html: string;
  },
) {
  const result = emptySendResult();

  for (let start = 0; start < input.recipients.length; start += BATCH_SIZE) {
    const chunk = input.recipients.slice(start, start + BATCH_SIZE);
    const payload = chunk.map((recipient) => ({
      from: input.from,
      to: recipient.email,
      replyTo: input.replyTo,
      subject: input.subject,
      html: input.html,
    }));

    let data: {
      data: { id: string }[];
      errors?: { index: number; message: string }[];
    } | null = null;
    let error: { message?: string; statusCode?: number | null } | null = null;

    for (let attempt = 1; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
      const response = await resend.batch.send(payload, {
        batchValidation: "permissive",
      });
      data = response.data;
      error = response.error;
      if (isRateLimitError(error) && attempt < MAX_RATE_LIMIT_RETRIES) {
        await sleep(rateLimitDelayMs(attempt));
        continue;
      }
      break;
    }

    if (error || !data) {
      const sequential = await sendOneByOne(resend, {
        ...input,
        recipients: chunk,
        attachments: undefined,
      });
      result.successCount += sequential.successCount;
      result.failureCount += sequential.failureCount;
      result.errors.push(...sequential.errors);
      result.recipientRecords.push(...sequential.recipientRecords);
      continue;
    }

    const failed = new Map(
      (data.errors ?? []).map((item) => [item.index, item.message]),
    );
    chunk.forEach((recipient, index) => {
      const failMessage = failed.get(index);
      if (failMessage) {
        markFailed(result, recipient, failMessage);
      } else {
        markSent(result, recipient);
      }
    });

    if (start + BATCH_SIZE < input.recipients.length) {
      await sleep(MIN_SEND_GAP_MS);
    }
  }

  return result;
}

export async function sendBulkEmail(
  input: SendBulkEmailInput,
): Promise<SendBulkEmailResult> {
  const senders = await getEmailSenders();
  const sender = getSenderByKey(senders, input.senderKey);
  if (!sender) {
    throw new Error("Invalid sender");
  }

  const site = await getSiteConfig("published");
  const html = wrapEmailHtml(input.htmlBody, emailOptionsFromSiteConfig(site));

  let recipients = input.testOnly
    ? [{ email: input.testEmail?.trim() || input.sentByEmail }]
    : await resolveRecipients(input.audience, {
        customEmails: input.customEmails,
        tagIds: input.tagIds,
      });

  recipients = recipients.filter((r) => r.email.includes("@"));
  if (recipients.length === 0) {
    throw new Error("No recipients found");
  }

  const resend = getResend();
  const dryRun = !resend;
  const attachments = toResendAttachments(input.attachments);

  let successCount = 0;
  let failureCount = 0;
  const errors: string[] = [];
  const recipientRecords: {
    email: string;
    name: string | null;
    status: "sent" | "failed";
    error: string | null;
  }[] = [];

  if (dryRun) {
    console.log("[email dry-run]", {
      from: `${sender.fromName} <${sender.fromEmail}>`,
      subject: input.subject,
      recipients: recipients.map((r) => r.email),
    });
    successCount = recipients.length;
    for (const recipient of recipients) {
      recipientRecords.push({
        email: recipient.email,
        name: recipient.label ?? null,
        status: "sent",
        error: null,
      });
    }
  } else {
    const from = `${sender.fromName} <${sender.fromEmail}>`;
    const sent = attachments
      ? await sendOneByOne(resend, {
          recipients,
          from,
          replyTo: sender.fromEmail,
          subject: input.subject,
          html,
          attachments,
        })
      : await sendInBatches(resend, {
          recipients,
          from,
          replyTo: sender.fromEmail,
          subject: input.subject,
          html,
        });
    successCount = sent.successCount;
    failureCount = sent.failureCount;
    errors.push(...sent.errors);
    recipientRecords.push(...sent.recipientRecords);
  }

  if (!input.testOnly) {
    await prisma.sentEmailBatch.create({
      data: {
        subject: input.subject,
        senderKey: input.senderKey,
        fromEmail: sender.fromEmail,
        fromName: sender.fromName,
        audience: input.audience,
        htmlBody: input.htmlBody,
        recipientCount: recipients.length,
        successCount,
        failureCount,
        sentByEmail: input.sentByEmail,
        dryRun,
        recipients: {
          create: recipientRecords,
        },
      },
    });
  }

  return {
    recipientCount: recipients.length,
    successCount,
    failureCount,
    errors: errors.slice(0, 10),
    dryRun,
  };
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}
