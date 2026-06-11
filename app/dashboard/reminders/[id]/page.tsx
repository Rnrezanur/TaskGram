import Link from "next/link";
import { notFound } from "next/navigation";
import { ReminderCard } from "@/components/reminders/reminder-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatLocalDateTime } from "@/lib/time";
import type { NotificationDelivery, Reminder, TaskOccurrence } from "@/lib/types";

export default async function ReminderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [reminderResult, deliveriesResult, occurrencesResult] = await Promise.all([
    supabase.from("reminders").select("*").eq("id", id).eq("user_id", user!.id).maybeSingle<Reminder>(),
    supabase.from("notification_deliveries").select("id,reminder_id,user_id,scheduled_for,sent_at,delivery_status,attempt_count,telegram_message_id,error_message,snoozed_from_id,created_at,updated_at").eq("reminder_id", id).eq("user_id", user!.id).order("scheduled_for", { ascending: false }).returns<NotificationDelivery[]>(),
    supabase.from("task_occurrences").select("id,reminder_id,user_id,due_at,status,completed_at,created_at,updated_at").eq("reminder_id", id).eq("user_id", user!.id).order("due_at", { ascending: false }).returns<TaskOccurrence[]>()
  ]);
  const reminder = reminderResult.data;
  if (!reminder) notFound();
  const deliveryRows = deliveriesResult.data;
  const deliveries = deliveryRows ?? [];
  const occurrences = occurrencesResult.data ?? [];
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold">{reminder.title}</h1><p className="text-muted-foreground">{formatLocalDateTime(reminder.due_at, reminder.timezone)}</p></div><Button asChild><Link href={`/dashboard/reminders/${id}/edit`}>Edit</Link></Button></div>
      <ReminderCard reminder={reminder} />
      <Card><CardHeader><CardTitle>Task occurrence history</CardTitle></CardHeader><CardContent className="space-y-2">{occurrences.length ? occurrences.map((occurrence) => <div key={occurrence.id} className="flex flex-col gap-2 rounded-md border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">Due {formatLocalDateTime(occurrence.due_at, reminder.timezone)}</p>{occurrence.status === "completed" && occurrence.completed_at && <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">Completed {formatLocalDateTime(occurrence.completed_at, reminder.timezone)}</p>}</div><span className="font-medium capitalize">{occurrence.status}</span></div>) : <p className="text-sm text-muted-foreground">No task occurrences yet.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Telegram delivery history</CardTitle></CardHeader><CardContent className="space-y-2">{deliveries.length ? deliveries.map((d) => <div key={d.id} className="flex justify-between rounded-md border p-3 text-sm"><span>{formatLocalDateTime(d.scheduled_for, reminder.timezone)}</span><span className="font-medium">{d.delivery_status}</span></div>) : <p className="text-sm text-muted-foreground">No delivery events yet.</p>}</CardContent></Card>
    </div>
  );
}
