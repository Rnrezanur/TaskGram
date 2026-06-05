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
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  let query = supabase
    .from("reminders")
    .select("id,user_id,title,description,category,custom_category,priority,due_at,timezone,reminder_minutes_before,telegram_enabled,recurrence_type,recurrence_interval,recurrence_end_at,next_occurrence_at,status,completed_at,archived_at,created_at,updated_at")
    .eq("user_id", user!.id)
    .order("due_at", { ascending: true });
  if (params.filter === "completed") query = query.eq("status", "completed");
  if (params.filter === "archived") query = query.eq("status", "archived");
  if (params.filter === "today") query = query.eq("status", "active").gte("due_at", todayStart.toISOString()).lt("due_at", tomorrowStart.toISOString());
  if (params.filter === "recurring") query = query.neq("recurrence_type", "none").eq("status", "active");
  if (params.filter === "upcoming") query = query.eq("status", "active").gte("due_at", new Date().toISOString());
  if (params.filter === "overdue") query = query.eq("status", "active").lt("due_at", new Date().toISOString());
  if (params.q) query = query.ilike("title", `%${params.q}%`);
  query = query.limit(75);
  const { data: reminderRows } = await query.returns<Reminder[]>();
  const reminders = reminderRows ?? [];
  const filters = [
    ["all", "All"],
    ["today", "Today"],
    ["upcoming", "Upcoming"],
    ["completed", "Completed"],
    ["overdue", "Overdue"],
    ["recurring", "Recurring"],
    ["archived", "Archived"]
  ];
  return (
    <div className="space-y-5">
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-3xl font-bold">Tasks</h1><p className="text-muted-foreground">Add work, search quickly, and keep finished tasks out of your way.</p></div>
          <Button asChild><Link href="/dashboard/reminders/new">Add task</Link></Button>
        </div>
      </div>
      <form className="space-y-3 rounded-lg border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input name="q" placeholder="Search tasks" defaultValue={params.q ?? ""} />
          <Button variant="outline">Search</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map(([value, label]) => (
            <Link
              key={value}
              href={`/dashboard/reminders?filter=${value}${params.q ? `&q=${encodeURIComponent(params.q)}` : ""}`}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${((params.filter ?? "all") === value) ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              {label}
            </Link>
          ))}
        </div>
      </form>
      <div className="space-y-3">{reminders.length ? reminders.map((r) => <ReminderCard key={r.id} reminder={r} />) : <EmptyState title="No matching reminders" text="Adjust filters or create a new reminder." />}</div>
    </div>
  );
}
