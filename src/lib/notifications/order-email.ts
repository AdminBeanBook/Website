import { Resend } from "resend";
import { getEmailSenders } from "@/lib/email/senders";
import { wrapEmailHtml } from "@/lib/email/templates";
import { getSiteConfig } from "@/lib/site-config";

type OrderNotifyFields = {
  id: string;
  customerEmail: string;
  customerName: string | null;
  amountCents: number;
  status: string;
};

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  return new Resend(key);
}

function resolveNotifyEmail(): string | null {
  const candidates = [
    process.env.ORDER_NOTIFY_EMAIL,
    process.env.ADMIN_EMAIL,
    process.env.SHIP_FROM_EMAIL,
    process.env.EMAIL_SENDER_CUSTOMERS,
  ];
  for (const value of candidates) {
    const email = value?.trim().toLowerCase();
    if (email?.includes("@")) return email;
  }
  return null;
}

function siteOrigin(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (url && !url.includes("localhost")) {
    return url.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export function isOrderEmailConfigured(): boolean {
  return Boolean(getResend() && resolveNotifyEmail());
}

/** Emails you when a new paid order lands. Never throws — logs failures only. */
export async function notifyNewOrderEmail(
  order: OrderNotifyFields,
): Promise<void> {
  const resend = getResend();
  const to = resolveNotifyEmail();
  if (!resend || !to) return;

  try {
    const senders = await getEmailSenders();
    const sender =
      senders.find((s) => s.key === "customers") ?? senders[0];
    if (!sender) {
      console.error("Order email: no sender configured");
      return;
    }

    const amount = (order.amountCents / 100).toFixed(2);
    const who = order.customerName?.trim() || order.customerEmail;
    const adminUrl = `${siteOrigin()}/admin/orders/${order.id}`;
    const site = await getSiteConfig("published");

    const bodyHtml = `
      <p style="margin:0 0 1em;"><strong>New Bean Book order</strong></p>
      <p style="margin:0 0 0.5em;">Amount: <strong>$${amount}</strong></p>
      <p style="margin:0 0 0.5em;">Customer: ${who}</p>
      <p style="margin:0 0 1em;">Email: ${order.customerEmail}</p>
      <p style="margin:0 0 1em;">Status: ${order.status}</p>
      <p style="margin:0;"><a href="${adminUrl}">View order in admin</a></p>
    `;

    const { error } = await resend.emails.send({
      from: `${sender.fromName} <${sender.fromEmail}>`,
      to,
      subject: `New order — $${amount} from ${who}`,
      html: wrapEmailHtml(bodyHtml, {
        colors: site.colors,
        logoUrl: site.images.logo,
        siteName: site.site.name,
      }),
    });

    if (error) {
      console.error("Order email failed:", error.message);
    }
  } catch (err) {
    console.error("Order email error:", err);
  }
}
