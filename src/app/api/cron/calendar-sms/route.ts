import { NextResponse } from "next/server";
import { sendCalendarSmsReminders } from "@/lib/calendar/sms-reminders";
import { todayIsoDay } from "@/lib/calendar/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorize(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    // Allow in development without a secret; require it in production.
    return process.env.NODE_ENV !== "production";
  }
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

async function run(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  const isoDay =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : todayIsoDay();

  const result = await sendCalendarSmsReminders(isoDay);
  const status = result.skipped ? 503 : result.ok ? 200 : 207;
  return NextResponse.json(result, { status });
}

/** Vercel Cron (and manual triggers) hit this daily. */
export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
