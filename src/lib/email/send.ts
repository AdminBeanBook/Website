import { Resend } from "resend";
import { getSiteConfig } from "@/lib/site-config";
import { getEmailSenders, getSenderByKey } from "@/lib/email/senders";
import { wrapEmailHtml } from "@/lib/email/templates";
import {
  resolveRecipients,
  type EmailAudience,
} from "@/lib/email/recipients";
import { prisma } from "@/lib/db";

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

export async function sendBulkEmail(
  input: SendBulkEmailInput,
): Promise<SendBulkEmailResult> {
  const senders = await getEmailSenders();
  const sender = getSenderByKey(senders, input.senderKey);
  if (!sender) {
    throw new Error("Invalid sender");
  }

  const colors = (await getSiteConfig("published")).colors;
  const html = wrapEmailHtml(input.htmlBody, colors);

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

  let successCount = 0;
  let failureCount = 0;
  const errors: string[] = [];

  if (dryRun) {
    console.log("[email dry-run]", {
      from: `${sender.fromName} <${sender.fromEmail}>`,
      subject: input.subject,
      recipients: recipients.map((r) => r.email),
    });
    successCount = recipients.length;
  } else {
    for (const recipient of recipients) {
      try {
        const { error } = await resend.emails.send({
          from: `${sender.fromName} <${sender.fromEmail}>`,
          to: recipient.email,
          subject: input.subject,
          html,
        });
        if (error) {
          failureCount += 1;
          errors.push(`${recipient.email}: ${error.message}`);
        } else {
          successCount += 1;
        }
      } catch (err) {
        failureCount += 1;
        errors.push(
          `${recipient.email}: ${err instanceof Error ? err.message : "Send failed"}`,
        );
      }
    }
  }

  if (!input.testOnly) {
    await prisma.sentEmailBatch.create({
      data: {
        subject: input.subject,
        senderKey: input.senderKey,
        audience: input.audience,
        htmlBody: input.htmlBody,
        recipientCount: recipients.length,
        successCount,
        failureCount,
        sentByEmail: input.sentByEmail,
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
