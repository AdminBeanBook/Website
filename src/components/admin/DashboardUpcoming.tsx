"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  dashboardChecklistOccurrences,
  formatLongDate,
  todayIsoDay,
  withOccurrenceDone,
  type CalendarEventRow,
} from "@/lib/calendar/types";

export function DashboardUpcoming({
  initialEvents,
}: {
  initialEvents: CalendarEventRow[];
}) {
  const [events, setEvents] = useState(initialEvents);
  const items = useMemo(
    () => dashboardChecklistOccurrences(events, todayIsoDay(), 5),
    [events],
  );

  async function toggleDone(
    eventId: string,
    date: string,
    done: boolean,
  ) {
    setEvents((list) =>
      list.map((event) =>
        event.id === eventId ? withOccurrenceDone(event, date, done) : event,
      ),
    );
    const res = await fetch(`/api/admin/calendar/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ occurrenceDate: date, done }),
    });
    if (!res.ok) {
      setEvents((list) =>
        list.map((event) =>
          event.id === eventId ? withOccurrenceDone(event, date, !done) : event,
        ),
      );
    }
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium">Coming up</h2>
        <Link
          href="/admin/calendar"
          className="text-sm text-brand-green hover:underline"
        >
          Open calendar
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-6 text-sm text-gray-500">
          Nothing left to check off.{" "}
          <Link
            href="/admin/calendar"
            className="font-medium text-brand-green hover:underline"
          >
            Add a reminder
          </Link>
          .
        </p>
      ) : (
        <ul className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {items.map((occ) => {
            const rowClass = occ.overdue
              ? "dashboard-overdue-flash"
              : occ.soon
                ? "bg-red-50"
                : "bg-white hover:bg-gray-50";
            return (
              <li
                key={`${occ.event.id}-${occ.date}`}
                className={`flex items-center gap-3 border-b border-black/5 px-4 py-3 last:border-0 ${rowClass}`}
              >
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => void toggleDone(occ.event.id, occ.date, true)}
                  className="h-4 w-4 shrink-0 rounded border-gray-300"
                  aria-label={`Mark ${occ.event.title} done`}
                />
                <Link
                  href={`/admin/calendar?event=${occ.event.id}&date=${occ.date}`}
                  className="min-w-0 flex-1"
                >
                  <span
                    className={`block text-sm font-medium ${
                      occ.overdue || occ.soon ? "text-red-950" : "text-gray-900"
                    }`}
                  >
                    {occ.event.title}
                  </span>
                  <span
                    className={`text-sm ${
                      occ.overdue
                        ? "font-medium text-red-900"
                        : occ.soon
                          ? "text-red-800"
                          : "text-gray-500"
                    }`}
                  >
                    {formatLongDate(occ.date)}
                    {occ.overdue
                      ? " · overdue"
                      : occ.soon
                        ? " · due soon"
                        : ""}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
