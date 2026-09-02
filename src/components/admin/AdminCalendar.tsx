"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addMonths,
  formatLongDate,
  formatMonthYear,
  monthGrid,
  monthStart,
  occurrencesOnDay,
  todayIsoDay,
  upcomingOccurrences,
  type CalendarEventRow,
  type CalendarRecurrence,
} from "@/lib/calendar/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const inputClass =
  "w-full rounded border border-gray-300 px-2 py-1.5 text-sm";

type Draft = {
  id?: string;
  title: string;
  notes: string;
  date: string;
  category: "tax" | "other";
  recurrence: CalendarRecurrence;
};

function emptyDraft(date: string): Draft {
  return {
    title: "",
    notes: "",
    date,
    category: "other",
    recurrence: "none",
  };
}

function draftFromEvent(event: CalendarEventRow): Draft {
  return {
    id: event.id,
    title: event.title,
    notes: event.notes ?? "",
    date: event.date,
    category: event.category,
    recurrence: event.recurrence,
  };
}

function isIsoDay(value: string | null | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function AdminCalendar({
  initialEvents,
  focusEventId = null,
  focusDate = null,
}: {
  initialEvents: CalendarEventRow[];
  focusEventId?: string | null;
  focusDate?: string | null;
}) {
  const focusedEvent = focusEventId
    ? initialEvents.find((event) => event.id === focusEventId) ?? null
    : null;
  const focusedDay = isIsoDay(focusDate)
    ? focusDate
    : focusedEvent?.date ?? null;

  const [events, setEvents] = useState(initialEvents);
  const [month, setMonth] = useState(() =>
    monthStart(focusedDay ?? todayIsoDay()),
  );
  const [draft, setDraft] = useState<Draft | null>(() =>
    focusedEvent ? draftFromEvent(focusedEvent) : null,
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const today = todayIsoDay();
  const focusCellRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    focusCellRef.current?.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }, []);

  const cells = useMemo(() => monthGrid(month), [month]);
  const upcoming = useMemo(
    () => upcomingOccurrences(events, today, 8),
    [events, today],
  );

  async function saveDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    setMessage(null);
    const payload = {
      title: draft.title,
      notes: draft.notes || undefined,
      date: draft.date,
      category: draft.category,
      recurrence: draft.recurrence,
    };
    const res = await fetch(
      draft.id ? `/api/admin/calendar/${draft.id}` : "/api/admin/calendar",
      {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error ?? "Could not save");
      return;
    }
    const saved = data as CalendarEventRow;
    setEvents((list) => {
      const next = draft.id
        ? list.map((item) => (item.id === saved.id ? saved : item))
        : [...list, saved];
      return next.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
    });
    setDraft(null);
  }

  async function removeEvent(id: string) {
    if (!confirm("Remove this calendar item?")) return;
    const res = await fetch(`/api/admin/calendar/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setEvents((list) => list.filter((item) => item.id !== id));
    setDraft(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Calendar</h1>
          <p className="mt-1 text-sm text-gray-600">
            Due dates and reminders. Click a day to add something.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDraft(emptyDraft(today))}
            className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Add item
          </button>
        </div>
      </div>

      {message && (
        <p className="text-sm text-green-800" role="status">
          {message}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMonth(addMonths(month, -1))}
              className="rounded-lg px-2 py-1 text-sm text-gray-700 hover:bg-gray-100"
            >
              ←
            </button>
            <h2 className="text-lg font-medium text-gray-900">
              {formatMonthYear(month)}
            </h2>
            <button
              type="button"
              onClick={() => setMonth(addMonths(month, 1))}
              className="rounded-lg px-2 py-1 text-sm text-gray-700 hover:bg-gray-100"
            >
              →
            </button>
          </div>
          <div className="grid grid-cols-7 gap-px text-center text-xs font-medium text-gray-500">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px rounded-lg bg-gray-200 ring-1 ring-gray-200">
            {cells.map((cell, index) => {
              if (!cell.isoDay) {
                return <div key={`empty-${index}`} className="min-h-[6.5rem] bg-gray-50" />;
              }
              const isoDay = cell.isoDay;
              const dayEvents = occurrencesOnDay(events, isoDay).slice().sort(
                (a, b) => {
                  if (a.event.id === focusEventId) return -1;
                  if (b.event.id === focusEventId) return 1;
                  return 0;
                },
              );
              const isToday = isoDay === today;
              const isFocused = isoDay === focusedDay;
              return (
                <div
                  key={isoDay}
                  ref={isFocused ? focusCellRef : undefined}
                  className={`flex min-h-[6.5rem] flex-col items-stretch gap-1 bg-white p-1.5 ${
                    isFocused
                      ? "ring-2 ring-inset ring-brand-green"
                      : isToday
                        ? "ring-1 ring-inset ring-brand-green/50"
                        : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setDraft(emptyDraft(isoDay))}
                    className={`self-end text-xs hover:underline ${
                      isToday
                        ? "rounded-full bg-brand-green px-1.5 py-0.5 font-semibold text-white"
                        : "text-gray-600"
                    }`}
                    aria-label={`Add item on ${isoDay}`}
                  >
                    {Number(isoDay.slice(8))}
                  </button>
                  <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                    {dayEvents.slice(0, 3).map((occ) => (
                      <button
                        key={`${occ.event.id}-${occ.date}`}
                        type="button"
                        onClick={() => setDraft(draftFromEvent(occ.event))}
                        className={`truncate rounded px-1 py-0.5 text-left text-[11px] leading-tight ${
                          occ.event.id === focusEventId
                            ? "bg-brand-green font-medium text-white"
                            : occ.event.category === "tax"
                              ? "bg-amber-100 text-amber-950"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {occ.event.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-gray-500">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                    {dayEvents.length === 0 && (
                      <button
                        type="button"
                        onClick={() => setDraft(emptyDraft(isoDay))}
                        className="min-h-[1.5rem] flex-1"
                        aria-label={`Add item on ${isoDay}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Click a day to add something. Tax items are amber; everything else is gray.
          </p>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Coming up</h2>
            {upcoming.length === 0 ? (
              <p className="mt-2 text-sm text-gray-500">
                Nothing scheduled. Add a tax date or any other reminder.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {upcoming.map((occ) => (
                  <li key={`${occ.event.id}-${occ.date}`}>
                    <button
                      type="button"
                      onClick={() => setDraft(draftFromEvent(occ.event))}
                      className="w-full text-left"
                    >
                      <p className="text-xs text-gray-500">
                        {formatLongDate(occ.date)}
                        {occ.event.recurrence === "monthly"
                          ? " · monthly"
                          : occ.event.recurrence === "yearly"
                            ? " · yearly"
                            : ""}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {occ.event.title}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
          <form
            onSubmit={(e) => void saveDraft(e)}
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-gray-900">
              {draft.id ? "Edit item" : "Add item"}
            </h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600" htmlFor="cal-title">
                  Title
                </label>
                <input
                  id="cal-title"
                  required
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  className={inputClass}
                  placeholder="File federal tax return"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600" htmlFor="cal-date">
                  Date
                </label>
                <input
                  id="cal-date"
                  type="date"
                  required
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600" htmlFor="cal-cat">
                  Type
                </label>
                <select
                  id="cal-cat"
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      category: e.target.value as Draft["category"],
                    })
                  }
                  className={inputClass}
                >
                  <option value="tax">Tax</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600" htmlFor="cal-repeat">
                  Repeat
                </label>
                <select
                  id="cal-repeat"
                  value={draft.recurrence}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      recurrence: e.target.value as CalendarRecurrence,
                    })
                  }
                  className={inputClass}
                >
                  <option value="none">Does not repeat</option>
                  <option value="monthly">Every month</option>
                  <option value="yearly">Every year</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600" htmlFor="cal-notes">
                  Notes
                </label>
                <textarea
                  id="cal-notes"
                  rows={3}
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  className={inputClass}
                  placeholder="Who files it, account, or anything you want to remember"
                />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
              {draft.id ? (
                <button
                  type="button"
                  onClick={() => void removeEvent(draft.id!)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  className="rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
