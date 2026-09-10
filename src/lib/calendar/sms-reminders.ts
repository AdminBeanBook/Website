import { prisma } from "@/lib/db";
import {
  formatLongDate,
  isOccurrenceCompleted,
  occurrencesOnDay,
  serializeCalendarEvent,
  todayIsoDay,
} from "@/lib/calendar/types";
import {
  resolveCalendarSmsTo,
  sendSms,
  isCalendarSmsConfigured,
} from "@/lib/sms/twilio";

export type CalendarSmsRunResult = {
  ok: boolean;
  skipped?: string;
  date: string;
  sent: number;
  skippedCompleted: number;
  skippedAlreadySent: number;
  errors: string[];
};

function buildMessage(input: {
  title: string;
  category: string;
  notes: string | null;
  date: string;
}): string {
  const when = formatLongDate(input.date);
  const kind = input.category === "tax" ? "Tax reminder" : "Calendar reminder";
  const notes = input.notes?.trim();
  const lines = [
    `Bean Book — ${kind}`,
    `${input.title}`,
    `Due: ${when}`,
  ];
  if (notes) lines.push(notes.slice(0, 120));
  lines.push("Mark done in admin → Calendar");
  return lines.join("\n");
}

/** Send SMS for incomplete calendar occurrences on a given day (default: today). */
export async function sendCalendarSmsReminders(
  isoDay = todayIsoDay(),
): Promise<CalendarSmsRunResult> {
  const result: CalendarSmsRunResult = {
    ok: true,
    date: isoDay,
    sent: 0,
    skippedCompleted: 0,
    skippedAlreadySent: 0,
    errors: [],
  };

  if (!isCalendarSmsConfigured()) {
    return {
      ...result,
      ok: false,
      skipped:
        "SMS not configured (set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, CALENDAR_SMS_TO)",
    };
  }

  const to = resolveCalendarSmsTo();
  if (!to) {
    return { ...result, ok: false, skipped: "CALENDAR_SMS_TO is invalid" };
  }

  const rows = await prisma.calendarEvent.findMany();
  const events = rows.map(serializeCalendarEvent);
  const due = occurrencesOnDay(events, isoDay);

  for (const occ of due) {
    if (isOccurrenceCompleted(occ.event, occ.date)) {
      result.skippedCompleted += 1;
      continue;
    }

    const already = await prisma.calendarSmsDelivery.findUnique({
      where: {
        eventId_occurrenceDate: {
          eventId: occ.event.id,
          occurrenceDate: occ.date,
        },
      },
    });
    if (already) {
      result.skippedAlreadySent += 1;
      continue;
    }

    try {
      await sendSms({
        to,
        body: buildMessage({
          title: occ.event.title,
          category: occ.event.category,
          notes: occ.event.notes,
          date: occ.date,
        }),
      });
      await prisma.calendarSmsDelivery.create({
        data: {
          eventId: occ.event.id,
          occurrenceDate: occ.date,
          toPhone: to,
        },
      });
      result.sent += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "SMS failed";
      result.errors.push(`${occ.event.id}: ${message}`);
      result.ok = false;
    }
  }

  return result;
}
