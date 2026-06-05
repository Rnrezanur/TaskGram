"use server";

import { addMinutes } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildInitialDelivery, buildSnoozeDelivery, nextRecurringDelivery } from "@/lib/reminders/schedule";
import { localDateParts, zonedDateTimeToUtc } from "@/lib/time";
import type { Reminder } from "@/lib/types";
import { reminderSchema, snoozeSchema } from "@/lib/validations/reminder";

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

async function telegramConnected(userId: string) {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("telegram_connections")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  return Boolean(data);
}

function formValues(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description") || null,
    date: formData.get("date"),
    time: formData.get("time"),
    timezone: formData.get("timezone"),
    priority: formData.get("priority"),
    category: formData.get("category"),
    customCategory: formData.get("customCategory") || null,
    telegramEnabled: formData.get("telegramEnabled") === "on",
    reminderMinutesBefore: formData.get("reminderMinutesBefore"),
    recurrenceType: formData.get("recurrenceType"),
    recurrenceInterval: formData.get("recurrenceInterval") || null,
    recurrenceEndDate: formData.get("recurrenceEndDate") || null,
    allowPast: formData.get("allowPast") === "on"
  };
}

export async function createReminderAction(_: unknown, formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = reminderSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid reminder" };
  if (parsed.data.telegramEnabled && !(await telegramConnected(user.id))) {
    return { error: "Connect Telegram before enabling Telegram reminders." };
  }
  const dueAt = zonedDateTimeToUtc(parsed.data.date, parsed.data.time, parsed.data.timezone);
  if (!parsed.data.allowPast && dueAt.getTime() < Date.now()) return { error: "Reminder cannot be scheduled in the past." };
  const nextOccurrenceAt = parsed.data.recurrenceType === "none" ? null : dueAt.toISOString();
  const { data, error } = await supabase
    .from("reminders")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      custom_category: parsed.data.customCategory,
      priority: parsed.data.priority,
      due_at: dueAt.toISOString(),
      timezone: parsed.data.timezone,
      reminder_minutes_before: parsed.data.reminderMinutesBefore,
      telegram_enabled: parsed.data.telegramEnabled,
      recurrence_type: parsed.data.recurrenceType,
      recurrence_interval: parsed.data.recurrenceInterval,
      recurrence_end_at: parsed.data.recurrenceEndDate ? zonedDateTimeToUtc(parsed.data.recurrenceEndDate, parsed.data.time, parsed.data.timezone).toISOString() : null,
      next_occurrence_at: nextOccurrenceAt
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  await supabase.from("notification_deliveries").insert(buildInitialDelivery(data.id, user.id, dueAt, parsed.data.reminderMinutesBefore));
  revalidatePath("/dashboard");
  redirect(`/dashboard/reminders/${data.id}`);
}

export async function updateReminderAction(id: string, _: unknown, formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = reminderSchema.safeParse(formValues(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid reminder" };
  if (parsed.data.telegramEnabled && !(await telegramConnected(user.id))) return { error: "Connect Telegram before enabling Telegram reminders." };
  const dueAt = zonedDateTimeToUtc(parsed.data.date, parsed.data.time, parsed.data.timezone);
  if (!parsed.data.allowPast && dueAt.getTime() < Date.now()) return { error: "Reminder cannot be scheduled in the past." };
  const { error } = await supabase
    .from("reminders")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      custom_category: parsed.data.customCategory,
      priority: parsed.data.priority,
      due_at: dueAt.toISOString(),
      timezone: parsed.data.timezone,
      reminder_minutes_before: parsed.data.reminderMinutesBefore,
      telegram_enabled: parsed.data.telegramEnabled,
      recurrence_type: parsed.data.recurrenceType,
      recurrence_interval: parsed.data.recurrenceInterval,
      recurrence_end_at: parsed.data.recurrenceEndDate ? zonedDateTimeToUtc(parsed.data.recurrenceEndDate, parsed.data.time, parsed.data.timezone).toISOString() : null
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  await supabase.from("notification_deliveries").update({ delivery_status: "cancelled" }).eq("reminder_id", id).eq("delivery_status", "pending");
  await supabase.from("notification_deliveries").insert(buildInitialDelivery(id, user.id, dueAt, parsed.data.reminderMinutesBefore));
  revalidatePath("/dashboard");
  redirect(`/dashboard/reminders/${id}`);
}

export async function completeReminderAction(id: string) {
  const { supabase, user } = await requireUser();
  const { data } = await supabase.from("reminders").select("*").eq("id", id).eq("user_id", user.id).single<Reminder>();
  if (!data) return;
  if (data.recurrence_type === "none") {
    await supabase.from("reminders").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
    await supabase.from("notification_deliveries").update({ delivery_status: "cancelled" }).eq("reminder_id", id).eq("delivery_status", "pending");
  } else {
    const next = nextRecurringDelivery(data);
    if (next) {
      await supabase.from("reminders").update({ due_at: next.dueAt.toISOString(), next_occurrence_at: next.dueAt.toISOString() }).eq("id", id).eq("user_id", user.id);
      await supabase.from("notification_deliveries").insert({ reminder_id: id, user_id: user.id, scheduled_for: next.scheduledFor.toISOString(), delivery_status: "pending" });
    }
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reminders");
  revalidatePath(`/dashboard/reminders/${id}`);
  redirect("/dashboard/reminders");
}

export async function archiveReminderAction(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("reminders").update({ status: "archived", archived_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id);
  await supabase.from("notification_deliveries").update({ delivery_status: "cancelled" }).eq("reminder_id", id).eq("delivery_status", "pending");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reminders");
  revalidatePath(`/dashboard/reminders/${id}`);
  redirect("/dashboard/reminders");
}

export async function deleteReminderAction(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("notification_deliveries").delete().eq("reminder_id", id).eq("user_id", user.id);
  await supabase.from("reminders").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard");
  redirect("/dashboard/reminders");
}

export async function snoozeReminderAction(_: unknown, formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = snoozeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Choose a valid snooze option." };
  await supabase.from("notification_deliveries").insert(buildSnoozeDelivery(parsed.data.reminderId, user.id, parsed.data.minutes, parsed.data.notificationId));
  revalidatePath("/dashboard");
  return { success: `Snoozed until ${addMinutes(new Date(), parsed.data.minutes).toLocaleString()}` };
}

export async function getReminderFormDefaults(reminder: Reminder) {
  const parts = localDateParts(reminder.due_at, reminder.timezone);
  return { ...reminder, date: parts.date, time: parts.time };
}
