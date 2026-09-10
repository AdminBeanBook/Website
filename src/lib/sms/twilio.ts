export type TwilioConfig = {
  accountSid: string;
  authToken: string;
  from: string;
};

export function getTwilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();
  if (!accountSid || !authToken || !from) return null;
  return { accountSid, authToken, from };
}

/** Normalize to E.164 when given a plain US 10-digit number. */
export function normalizePhoneE164(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^\+[1-9]\d{7,14}$/.test(trimmed)) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export function resolveCalendarSmsTo(): string | null {
  const raw =
    process.env.CALENDAR_SMS_TO?.trim() ||
    process.env.SHIP_FROM_PHONE?.trim() ||
    "";
  return normalizePhoneE164(raw);
}

export function isCalendarSmsConfigured(): boolean {
  return Boolean(getTwilioConfig() && resolveCalendarSmsTo());
}

export async function sendSms(input: {
  to: string;
  body: string;
}): Promise<{ sid: string }> {
  const config = getTwilioConfig();
  if (!config) {
    throw new Error("Twilio is not configured");
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
  const auth = Buffer.from(
    `${config.accountSid}:${config.authToken}`,
  ).toString("base64");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: input.to,
      From: config.from,
      Body: input.body,
    }),
  });

  const data = (await res.json()) as { sid?: string; message?: string };
  if (!res.ok || !data.sid) {
    throw new Error(data.message ?? `Twilio SMS failed (${res.status})`);
  }
  return { sid: data.sid };
}
