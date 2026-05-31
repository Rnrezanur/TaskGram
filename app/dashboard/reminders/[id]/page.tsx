import Link from "next/link";
import { notFound } from "next/navigation";
import { ReminderCard } from "@/components/reminders/reminder-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatLocalDateTime } from "@/lib/time";
import type { NotificationDelivery, Reminder } from "@/lib/types";

export default async function ReminderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: reminder } = await supabase.from("reminders").select("*").eq("id", id).eq("user_id", user!.id).maybeSingle<Reminder>();
  if (!reminder) notFound();
  const { data: deliveryRows } = await supabase.from("notification_deliveries").select("*").eq("reminder_id", id).eq("user_id", user!.id).order("scheduled_for", { ascending: false }).returns<NotificationDelivery[]>();
  const deliveries = deliveryRows ?? [];
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold">{reminder.title}</h1><p className="text-muted-foreground">{formatLocalDateTime(reminder.due_at, reminder.timezone)}</p></div><Button asChild><Link href={`/dashboard/reminders/${id}/edit`}>Edit</Link></Button></div>
      <ReminderCard reminder={reminder} />
      <Card><CardHeader><CardTitle>Telegram delivery history</CardTitle></CardHeader><CardContent className="space-y-2">{deliveries.length ? deliveries.map((d) => <div key={d.id} className="flex justify-between rounded-md border p-3 text-sm"><span>{formatLocalDateTime(d.scheduled_for, reminder.timezone)}</span><span className="font-medium">{d.delivery_status}</span></div>) : <p className="text-sm text-muted-foreground">No delivery events yet.</p>}</CardContent></Card>
    </div>
  );
}
