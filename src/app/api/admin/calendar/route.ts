import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  isoDayToUtcDate,
  isCalendarCategory,
  isCalendarRecurrence,
  serializeCalendarEvent,
} from "@/lib/calendar/types";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await prisma.calendarEvent.findMany({
    orderBy: [{ date: "asc" }, { title: "asc" }],
  });
  return NextResponse.json(events.map(serializeCalendarEvent));
}

export async function POST(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    title?: string;
    notes?: string;
    date?: string;
    category?: string;
    recurrence?: string;
  };

  const title = body.title?.trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  let date: Date;
  try {
    date = isoDayToUtcDate(body.date ?? "");
  } catch {
    return NextResponse.json({ error: "A valid date is required" }, { status: 400 });
  }

  const category = body.category ?? "other";
  const recurrence = body.recurrence ?? "none";
  if (!isCalendarCategory(category) || !isCalendarRecurrence(recurrence)) {
    return NextResponse.json({ error: "Invalid category or repeat" }, { status: 400 });
  }

  const event = await prisma.calendarEvent.create({
    data: {
      title,
      notes: body.notes?.trim() || null,
      date,
      category,
      recurrence,
    },
  });
  return NextResponse.json(serializeCalendarEvent(event), { status: 201 });
}
