import { notFound } from "next/navigation";
import { ReminderForm } from "@/components/reminders/reminder-form";
import { getReminderFormDefaults, updateReminderAction } from "@/lib/actions/reminders";
import { createClient } from "@/lib/supabase/server";
import type { Reminder } from "@/lib/types";

export default async function EditReminderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: reminder } = await supabase.from("reminders").select("*").eq("id", id).eq("user_id", user!.id).maybeSingle<Reminder>();
  if (!reminder) notFound();
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user!.id).single();
  const { data: connection } = await supabase.from("telegram_connections").select("id").eq("user_id", user!.id).eq("is_active", true).maybeSingle();
  const initial = await getReminderFormDefaults(reminder);
  return <div className="space-y-5"><div><h1 className="text-3xl font-bold">Edit reminder</h1><p className="text-muted-foreground">Changes recalculate pending notification timing and preserve history.</p></div><ReminderForm action={updateReminderAction.bind(null, id)} initial={initial} telegramConnected={Boolean(connection)} defaultTimezone={profile?.timezone ?? "Asia/Dhaka"} /></div>;
}
