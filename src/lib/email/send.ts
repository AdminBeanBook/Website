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

  const site = await getSiteConfig("published");
  const html = wrapEmailHtml(input.htmlBody, {
    colors: site.colors,
    logoUrl: site.images.logo,
    siteName: site.site.name,
    tagline: "Denver coffee passbook",
  });

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
          recipientRecords.push({
            email: recipient.email,
            name: recipient.label ?? null,
            status: "failed",
            error: error.message,
          });
        } else {
          successCount += 1;
          recipientRecords.push({
            email: recipient.email,
            name: recipient.label ?? null,
            status: "sent",
            error: null,
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Send failed";
        failureCount += 1;
        errors.push(`${recipient.email}: ${message}`);
        recipientRecords.push({
          email: recipient.email,
          name: recipient.label ?? null,
          status: "failed",
          error: message,
        });
      }
    }
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
