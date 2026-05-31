import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { ReminderCard } from "@/components/reminders/reminder-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import type { Reminder } from "@/lib/types";

export default async function RemindersPage({ searchParams }: { searchParams: Promise<{ filter?: string; q?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let query = supabase.from("reminders").select("*").eq("user_id", user!.id).order("due_at", { ascending: true });
  if (params.filter === "completed") query = query.eq("status", "completed");
  if (params.filter === "archived") query = query.eq("status", "archived");
  if (params.q) query = query.ilike("title", `%${params.q}%`);
  const { data: reminderRows } = await query.returns<Reminder[]>();
  const reminders = reminderRows ?? [];
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h1 className="text-3xl font-bold">Reminders</h1><p className="text-muted-foreground">Search, filter, sort, edit, complete, snooze, archive, or delete tasks.</p></div><Button asChild><Link href="/dashboard/reminders/new">Add Reminder</Link></Button></div>
      <form className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_auto_auto]"><Input name="q" placeholder="Search reminders" defaultValue={params.q ?? ""} /><select name="filter" defaultValue={params.filter ?? "all"} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="all">All</option><option value="today">Today</option><option value="upcoming">Upcoming</option><option value="completed">Completed</option><option value="archived">Archived</option><option value="overdue">Overdue</option><option value="recurring">Recurring</option></select><Button variant="outline">Apply</Button></form>
      <div className="space-y-3">{reminders.length ? reminders.map((r) => <ReminderCard key={r.id} reminder={r} />) : <EmptyState title="No matching reminders" text="Adjust filters or create a new reminder." />}</div>
    </div>
  );
}
