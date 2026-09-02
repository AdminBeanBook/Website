export const CALENDAR_CATEGORIES = ["tax", "other"] as const;
export type CalendarCategory = (typeof CALENDAR_CATEGORIES)[number];

export const CALENDAR_RECURRENCES = ["none", "monthly", "yearly"] as const;
export type CalendarRecurrence = (typeof CALENDAR_RECURRENCES)[number];

export type CalendarEventRow = {
  id: string;
  title: string;
  notes: string | null;
  date: string;
  category: CalendarCategory;
  recurrence: CalendarRecurrence;
  completedDates: string[];
  createdAt: string;
  updatedAt: string;
};

export type CalendarOccurrence = {
  date: string;
  event: CalendarEventRow;
};

export function isCalendarCategory(value: string): value is CalendarCategory {
  return (CALENDAR_CATEGORIES as readonly string[]).includes(value);
}

export function isCalendarRecurrence(
  value: string,
): value is CalendarRecurrence {
  return (CALENDAR_RECURRENCES as readonly string[]).includes(value);
}

export function dateToIsoDay(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function isoDayToUtcDate(isoDay: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDay.trim());
  if (!match) {
    throw new Error("Date must be YYYY-MM-DD");
  }
  return new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00.000Z`);
}

export function todayIsoDay(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addMonths(isoDay: string, delta: number): string {
  const date = isoDayToUtcDate(isoDay);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + delta;
  const day = date.getUTCDate();
  const next = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(
    Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0),
  ).getUTCDate();
  next.setUTCDate(Math.min(day, lastDay));
  return dateToIsoDay(next);
}

export function monthStart(isoDay: string): string {
  return `${isoDay.slice(0, 7)}-01`;
}

export function monthEnd(isoDay: string): string {
  const date = isoDayToUtcDate(monthStart(isoDay));
  const last = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  );
  return dateToIsoDay(last);
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function shiftYear(isoDay: string, year: number): string {
  const [, month, day] = isoDay.split("-").map(Number) as [number, number, number];
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${pad(month)}-${pad(Math.min(day, lastDay))}`;
}

export function shiftToYearMonth(
  isoDay: string,
  year: number,
  month: number,
): string {
  const day = Number(isoDay.slice(8, 10));
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${pad(month)}-${pad(Math.min(day, lastDay))}`;
}

export function serializeCalendarEvent(event: {
  id: string;
  title: string;
  notes: string | null;
  date: Date;
  category: string;
  recurrence: string;
  completedDates?: string[];
  createdAt: Date;
  updatedAt: Date;
}): CalendarEventRow {
  return {
    id: event.id,
    title: event.title,
    notes: event.notes,
    date: dateToIsoDay(event.date),
    category: isCalendarCategory(event.category) ? event.category : "other",
    recurrence: isCalendarRecurrence(event.recurrence)
      ? event.recurrence
      : "none",
    completedDates: event.completedDates ?? [],
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

export function occurrencesOnDay(
  events: CalendarEventRow[],
  isoDay: string,
): CalendarOccurrence[] {
  return events
    .filter((event) => {
      if (isoDay < event.date) return false;
      if (event.recurrence === "none") return event.date === isoDay;
      const year = Number(isoDay.slice(0, 4));
      const month = Number(isoDay.slice(5, 7));
      if (event.recurrence === "monthly") {
        return shiftToYearMonth(event.date, year, month) === isoDay;
      }
      return shiftYear(event.date, year) === isoDay;
    })
    .map((event) => ({ date: isoDay, event }));
}

export function isOccurrenceCompleted(
  event: CalendarEventRow,
  isoDay: string,
): boolean {
  return event.completedDates.includes(isoDay);
}

export function withOccurrenceDone(
  event: CalendarEventRow,
  isoDay: string,
  done: boolean,
): CalendarEventRow {
  const set = new Set(event.completedDates);
  if (done) set.add(isoDay);
  else set.delete(isoDay);
  return { ...event, completedDates: [...set] };
}

export const DASHBOARD_SOON_DAYS = 7;

export function daysFromTo(fromIsoDay: string, toIsoDay: string): number {
  const from = isoDayToUtcDate(fromIsoDay).getTime();
  const to = isoDayToUtcDate(toIsoDay).getTime();
  return Math.round((to - from) / 86_400_000);
}

export type ChecklistOccurrence = CalendarOccurrence & {
  overdue: boolean;
  soon: boolean;
};

export function dashboardChecklistOccurrences(
  events: CalendarEventRow[],
  today: string,
  count: number,
): ChecklistOccurrence[] {
  const items: ChecklistOccurrence[] = [];
  const seen = new Set<string>();
  let cursor = addDays(today, -400);
  const end = addDays(today, 370);
  while (cursor <= end) {
    for (const occ of occurrencesOnDay(events, cursor)) {
      const key = `${occ.event.id}:${occ.date}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (isOccurrenceCompleted(occ.event, occ.date)) continue;
      const delta = daysFromTo(today, occ.date);
      items.push({
        ...occ,
        overdue: delta < 0,
        soon: delta >= 0 && delta <= DASHBOARD_SOON_DAYS,
      });
    }
    cursor = addDays(cursor, 1);
  }
  items.sort((a, b) => a.date.localeCompare(b.date));
  return items.slice(0, count);
}

export function upcomingOccurrences(
  events: CalendarEventRow[],
  fromIsoDay: string,
  count: number,
): CalendarOccurrence[] {
  const out: CalendarOccurrence[] = [];
  const seen = new Set<string>();
  let cursor = fromIsoDay;
  for (let i = 0; i < 370 && out.length < count; i++) {
    for (const occ of occurrencesOnDay(events, cursor)) {
      const key = `${occ.event.id}:${occ.date}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (isOccurrenceCompleted(occ.event, occ.date)) continue;
      out.push(occ);
      if (out.length >= count) break;
    }
    cursor = addDays(cursor, 1);
  }
  return out;
}

export function addDays(isoDay: string, delta: number): string {
  const date = isoDayToUtcDate(isoDay);
  date.setUTCDate(date.getUTCDate() + delta);
  return dateToIsoDay(date);
}

export function formatLongDate(isoDay: string): string {
  const date = isoDayToUtcDate(isoDay);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatMonthYear(isoDay: string): string {
  const date = isoDayToUtcDate(monthStart(isoDay));
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export type CalendarCell = {
  isoDay: string | null;
};

export function monthGrid(isoDay: string): CalendarCell[] {
  const start = isoDayToUtcDate(monthStart(isoDay));
  const end = isoDayToUtcDate(monthEnd(isoDay));
  const weekday = start.getUTCDay();
  const days = end.getUTCDate();
  const cells: CalendarCell[] = [];
  for (let i = 0; i < weekday; i++) cells.push({ isoDay: null });
  for (let day = 1; day <= days; day++) {
    cells.push({
      isoDay: `${start.getUTCFullYear()}-${pad(start.getUTCMonth() + 1)}-${pad(day)}`,
    });
  }
  while (cells.length % 7 !== 0) cells.push({ isoDay: null });
  return cells;
}
