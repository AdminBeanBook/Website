import { AdminCalendar } from "@/components/admin/AdminCalendar";
import { serializeCalendarEvent } from "@/lib/calendar/types";
import { prisma } from "@/lib/db";

type AdminCalendarPageProps = {
  searchParams: Promise<{ event?: string; date?: string }>;
};

export default async function AdminCalendarPage({
  searchParams,
}: AdminCalendarPageProps) {
  const params = await searchParams;
  const events = await prisma.calendarEvent.findMany({
    orderBy: [{ date: "asc" }, { title: "asc" }],
  });

  return (
    <AdminCalendar
      initialEvents={events.map(serializeCalendarEvent)}
      focusEventId={params.event?.trim() || null}
      focusDate={params.date?.trim() || null}
    />
  );
}
