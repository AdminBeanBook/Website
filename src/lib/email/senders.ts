import { prisma } from "@/lib/db";

export type EmailSender = {
  key: string;
  label: string;
  fromEmail: string;
  fromName: string;
};

const SETTINGS_ID = "default";

export function getDefaultSenders(): EmailSender[] {
  return [
    {
      key: "shops",
      label: "Coffee shops & partners",
      fromEmail:
        process.env.EMAIL_SENDER_SHOPS?.trim() || "shops@thebeanbook.org",
      fromName:
        process.env.EMAIL_SENDER_SHOPS_NAME?.trim() || "The Bean Book — Shops",
    },
    {
      key: "customers",
      label: "Customers & admin",
      fromEmail:
        process.env.EMAIL_SENDER_CUSTOMERS?.trim() || "admin@thebeanbook.org",
      fromName:
        process.env.EMAIL_SENDER_CUSTOMERS_NAME?.trim() || "The Bean Book",
    },
  ];
}

export async function getEmailSenders(): Promise<EmailSender[]> {
  const defaults = getDefaultSenders();
  try {
    const row = await prisma.emailSettings.findUnique({
      where: { id: SETTINGS_ID },
    });
    if (!row) return defaults;
    const parsed = JSON.parse(row.sendersJson) as EmailSender[];
    if (!Array.isArray(parsed) || parsed.length === 0) return defaults;
    return defaults.map((def) => {
      const saved = parsed.find((s) => s.key === def.key);
      return {
        ...def,
        fromName: saved?.fromName?.trim() || def.fromName,
        fromEmail: def.fromEmail,
      };
    });
  } catch {
    return defaults;
  }
}

export async function saveEmailSenders(senders: EmailSender[]) {
  return prisma.emailSettings.upsert({
    where: { id: SETTINGS_ID },
    create: {
      id: SETTINGS_ID,
      sendersJson: JSON.stringify(senders),
    },
    update: {
      sendersJson: JSON.stringify(senders),
    },
  });
}

export async function ensureEmailSettings() {
  const existing = await prisma.emailSettings.findUnique({
    where: { id: SETTINGS_ID },
  });
  if (existing) return existing;
  return prisma.emailSettings.create({
    data: {
      id: SETTINGS_ID,
      sendersJson: JSON.stringify(getDefaultSenders()),
    },
  });
}

export function getSenderByKey(
  senders: EmailSender[],
  key: string,
): EmailSender | undefined {
  return senders.find((s) => s.key === key);
}
