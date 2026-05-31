import Link from "next/link";
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Reminder } from "@/lib/types";

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: reminderRows } = await supabase.from("reminders").select("*").eq("user_id", user!.id).eq("status", "active").returns<Reminder[]>();
  const reminders = reminderRows ?? [];
  const days = eachDayOfInterval({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) });
  return (
    <div className="space-y-5"><div><h1 className="text-3xl font-bold">Calendar</h1><p className="text-muted-foreground">Monthly view with mobile-friendly agenda list.</p></div>
      <div className="grid gap-3 md:grid-cols-7">{days.map((day) => {
        const dayReminders = reminders.filter((r) => new Date(r.due_at).toDateString() === day.toDateString());
        return <Card key={day.toISOString()}><CardContent className="min-h-28 p-3"><p className="text-sm font-semibold">{format(day, "d")}</p><div className="mt-2 space-y-1">{dayReminders.slice(0, 3).map((r) => <Link key={r.id} href={`/dashboard/reminders/${r.id}`} className={`block truncate rounded px-2 py-1 text-xs ${r.priority === "high" ? "bg-red-100 text-red-700" : r.priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{r.title}</Link>)}</div></CardContent></Card>;
      })}</div>
      <div className="space-y-2 md:hidden">{reminders.map((r) => <Link key={r.id} href={`/dashboard/reminders/${r.id}`} className="block rounded-md border bg-card p-3 text-sm">{r.title}</Link>)}</div>
    </div>
  );
}
