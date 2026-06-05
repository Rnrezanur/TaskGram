import Link from "next/link";
import { AlertTriangle, Bell, CheckCircle2, Clock } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ReminderCard } from "@/components/reminders/reminder-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TelegramStatusCard } from "@/components/telegram/telegram-status-card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { Reminder, TelegramConnection } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [profileResult, remindersResult, connectionResult] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user!.id).single(),
    supabase
      .from("reminders")
      .select("id,user_id,title,description,category,custom_category,priority,due_at,timezone,reminder_minutes_before,telegram_enabled,recurrence_type,recurrence_interval,recurrence_end_at,next_occurrence_at,status,completed_at,archived_at,created_at,updated_at")
      .eq("user_id", user!.id)
      .order("due_at", { ascending: true })
      .returns<Reminder[]>(),
    supabase.from("telegram_connections").select("id,user_id,telegram_chat_id,telegram_username,telegram_first_name,is_active,connected_at,disconnected_at,last_test_message_at").eq("user_id", user!.id).eq("is_active", true).maybeSingle<TelegramConnection>()
  ]);
  const profile = profileResult.data;
  const reminderRows = remindersResult.data;
  const reminders = reminderRows ?? [];
  const connection = connectionResult.data;
  // eslint-disable-next-line react-hooks/purity -- Server-rendered dashboard stats are intentionally time-based.
  const now = Date.now();
  const active = reminders.filter((r) => r.status === "active");
  const completed = reminders.filter((r) => r.status === "completed").length;
  const overdue = active.filter((r) => new Date(r.due_at).getTime() < now).length;
  const today = active.filter((r) => new Date(r.due_at).toDateString() === new Date().toDateString());
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-3xl font-bold">Good afternoon, {profile?.full_name || "there"}</h1><p className="text-muted-foreground">You have {today.length} reminders scheduled for today.</p></div>
        <Button asChild><Link href="/dashboard/reminders/new">Add Reminder</Link></Button>
      </div>
      {!connection && <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">Connect Telegram to receive automatic reminder notifications.</div>}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Tasks today" value={today.length} icon={Clock} />
        <StatCard label="Upcoming" value={active.length} icon={Bell} />
        <StatCard label="Completed" value={completed} icon={CheckCircle2} />
        <StatCard label="Overdue" value={overdue} icon={AlertTriangle} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-4"><h2 className="text-xl font-semibold">Today and upcoming</h2>{active.length ? active.slice(0, 6).map((r) => <ReminderCard key={r.id} reminder={r} />) : <EmptyState title="No reminders yet" text="Create your first reminder and TaskGram will keep the schedule." />}</section>
        <aside className="space-y-4"><TelegramStatusCard connection={connection} /><Button asChild className="w-full" variant="secondary"><Link href="/dashboard/reminders/new">Quick add reminder</Link></Button><div className="rounded-lg border bg-card p-5"><h3 className="font-semibold">Recent activity</h3><p className="mt-2 text-sm text-muted-foreground">Notification history appears as reminders are processed.</p></div></aside>
      </div>
    </div>
  );
}
