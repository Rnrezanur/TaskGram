import { ReminderForm } from "@/components/reminders/reminder-form";
import { createReminderAction } from "@/lib/actions/reminders";
import { createClient } from "@/lib/supabase/server";

export default async function NewReminderPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user!.id).single();
  const { data: connection } = await supabase.from("telegram_connections").select("id").eq("user_id", user!.id).eq("is_active", true).maybeSingle();
  return <div className="space-y-5"><div><h1 className="text-3xl font-bold">Create reminder</h1><p className="text-muted-foreground">Set a due time, notification timing, and recurrence.</p></div><ReminderForm action={createReminderAction} telegramConnected={Boolean(connection)} defaultTimezone={profile?.timezone ?? "Asia/Dhaka"} /></div>;
}
