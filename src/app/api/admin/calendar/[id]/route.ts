import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  isoDayToUtcDate,
  isCalendarCategory,
  isCalendarRecurrence,
  serializeCalendarEvent,
} from "@/lib/calendar/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    title?: string;
    notes?: string | null;
    date?: string;
    category?: string;
    recurrence?: string;
    occurrenceDate?: string;
    done?: boolean;
  };

  const data: {
    title?: string;
    notes?: string | null;
    date?: Date;
    category?: string;
    recurrence?: string;
    completedDates?: string[];
  } = {};

  if (body.title !== undefined) {
    const title = body.title.trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    data.title = title;
  }
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null;
  if (body.date !== undefined) {
    try {
      data.date = isoDayToUtcDate(body.date);
    } catch {
      return NextResponse.json({ error: "A valid date is required" }, { status: 400 });
    }
  }
  if (body.category !== undefined) {
    if (!isCalendarCategory(body.category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    data.category = body.category;
  }
  if (body.recurrence !== undefined) {
    if (!isCalendarRecurrence(body.recurrence)) {
      return NextResponse.json({ error: "Invalid repeat" }, { status: 400 });
    }
    data.recurrence = body.recurrence;
  }
  if (body.occurrenceDate !== undefined && body.done !== undefined) {
    let occurrenceDate: string;
    try {
      occurrenceDate = isoDayToUtcDate(body.occurrenceDate)
        .toISOString()
        .slice(0, 10);
    } catch {
      return NextResponse.json({ error: "A valid date is required" }, { status: 400 });
    }
    const existing = await prisma.calendarEvent.findUnique({
      where: { id },
      select: { completedDates: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    const set = new Set(existing.completedDates);
    if (body.done) set.add(occurrenceDate);
    else set.delete(occurrenceDate);
    data.completedDates = [...set];
  }

  try {
    const event = await prisma.calendarEvent.update({
      where: { id },
      data,
    });
    return NextResponse.json(serializeCalendarEvent(event));
  } catch {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    await prisma.calendarEvent.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
}
