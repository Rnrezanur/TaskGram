import Link from "next/link";
import { AlertTriangle, BarChart3, Bell, CheckCircle2, Clock, NotebookPen, Plus, WalletCards } from "lucide-react";
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
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const nowIso = new Date().toISOString();

  const [profileResult, remindersResult, connectionResult, todayResult, upcomingResult, completedResult, overdueResult] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user!.id).single(),
    supabase
      .from("reminders")
      .select("id,user_id,title,description,category,custom_category,priority,due_at,timezone,reminder_minutes_before,telegram_enabled,recurrence_type,recurrence_interval,recurrence_end_at,next_occurrence_at,status,completed_at,archived_at,created_at,updated_at")
      .eq("user_id", user!.id)
      .eq("status", "active")
      .order("due_at", { ascending: true })
      .limit(6)
      .returns<Reminder[]>(),
    supabase.from("telegram_connections").select("id,user_id,telegram_chat_id,telegram_username,telegram_first_name,is_active,connected_at,disconnected_at,last_test_message_at").eq("user_id", user!.id).eq("is_active", true).maybeSingle<TelegramConnection>(),
    supabase.from("reminders").select("id", { count: "exact", head: true }).eq("user_id", user!.id).eq("status", "active").gte("due_at", todayStart.toISOString()).lt("due_at", tomorrowStart.toISOString()),
    supabase.from("reminders").select("id", { count: "exact", head: true }).eq("user_id", user!.id).eq("status", "active").gte("due_at", nowIso),
    supabase.from("reminders").select("id", { count: "exact", head: true }).eq("user_id", user!.id).eq("status", "completed"),
    supabase.from("reminders").select("id", { count: "exact", head: true }).eq("user_id", user!.id).eq("status", "active").lt("due_at", nowIso)
  ]);
  const profile = profileResult.data;
  const reminderRows = remindersResult.data;
  const active = reminderRows ?? [];
  const connection = connectionResult.data;
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">TaskGram workspace</p>
            <h1 className="mt-2 text-3xl font-bold">Good afternoon, {profile?.full_name || "there"}</h1>
            <p className="mt-1 text-muted-foreground">You have {todayResult.count ?? 0} reminders scheduled for today.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild><Link href="/dashboard/reminders/new"><Plus className="h-4 w-4" />Add task</Link></Button>
            <Button asChild variant="outline"><Link href="/dashboard/reminders">Manage tasks</Link></Button>
          </div>
        </div>
      </div>
      {!connection && <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">Connect Telegram to receive automatic reminder notifications.</div>}
      <div className="grid gap-3 md:grid-cols-3">
        <Link href="/dashboard/notes" className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-sky-500/10 text-sky-600"><NotebookPen className="h-5 w-5" /></div>
          <div><p className="font-semibold">Keep notes</p><p className="text-sm text-muted-foreground">Capture ideas, plans, and useful information.</p></div>
        </Link>
        <Link href="/dashboard/finance" className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600"><WalletCards className="h-5 w-5" /></div>
          <div><p className="font-semibold">Track money</p><p className="text-sm text-muted-foreground">Record income, expenses, and monthly spending.</p></div>
        </Link>
        <Link href="/dashboard/records" className="flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-violet-500/10 text-violet-600"><BarChart3 className="h-5 w-5" /></div>
          <div><p className="font-semibold">Review progress</p><p className="text-sm text-muted-foreground">See daily and monthly task records.</p></div>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Tasks today" value={todayResult.count ?? 0} icon={Clock} />
        <StatCard label="Upcoming" value={upcomingResult.count ?? 0} icon={Bell} />
        <StatCard label="Completed" value={completedResult.count ?? 0} icon={CheckCircle2} />
        <StatCard label="Overdue" value={overdueResult.count ?? 0} icon={AlertTriangle} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-4"><h2 className="text-xl font-semibold">Today and upcoming</h2>{active.length ? active.slice(0, 6).map((r) => <ReminderCard key={r.id} reminder={r} />) : <EmptyState title="No reminders yet" text="Create your first reminder and TaskGram will keep the schedule." />}</section>
        <aside className="space-y-4"><TelegramStatusCard connection={connection} /><Button asChild className="w-full" variant="secondary"><Link href="/dashboard/reminders/new">Quick add reminder</Link></Button><div className="rounded-lg border bg-card p-5"><h3 className="font-semibold">Recent activity</h3><p className="mt-2 text-sm text-muted-foreground">Notification history appears as reminders are processed.</p></div></aside>
      </div>
    </div>
  );
}
