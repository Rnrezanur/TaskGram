"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { settingsSchema } from "@/lib/validations/reminder";

export async function updateSettingsAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const parsed = settingsSchema.safeParse({
    fullName: formData.get("fullName"),
    timezone: formData.get("timezone"),
    timeFormat: formData.get("timeFormat"),
    defaultReminderMinutes: formData.get("defaultReminderMinutes"),
    telegramNotificationsEnabled: formData.get("telegramNotificationsEnabled") === "on",
    theme: formData.get("theme")
  });
  if (!parsed.success) return;
  await supabase.from("profiles").update({
    full_name: parsed.data.fullName,
    timezone: parsed.data.timezone,
    time_format: parsed.data.timeFormat,
    default_reminder_minutes: parsed.data.defaultReminderMinutes,
    telegram_notifications_enabled: parsed.data.telegramNotificationsEnabled,
    theme: parsed.data.theme
  }).eq("id", user.id);
  revalidatePath("/dashboard/settings");
}
