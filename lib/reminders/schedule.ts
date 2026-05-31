import { addMinutes } from "date-fns";
import { notificationTime, nextOccurrence } from "@/lib/time";
import type { Reminder } from "@/lib/types";

export function buildInitialDelivery(reminderId: string, userId: string, dueAt: Date, minutesBefore: number) {
  return {
    reminder_id: reminderId,
    user_id: userId,
    scheduled_for: notificationTime(dueAt, minutesBefore).toISOString(),
    delivery_status: "pending"
  };
}

export function buildSnoozeDelivery(reminderId: string, userId: string, minutes: number, fromId?: string) {
  return {
    reminder_id: reminderId,
    user_id: userId,
    scheduled_for: addMinutes(new Date(), minutes).toISOString(),
    delivery_status: "pending",
    snoozed_from_id: fromId ?? null
  };
}

export function nextRecurringDelivery(reminder: Reminder) {
  const next = nextOccurrence(new Date(reminder.due_at), reminder.recurrence_type, reminder.recurrence_interval ?? 1);
  if (!next) return null;
  if (reminder.recurrence_end_at && next > new Date(reminder.recurrence_end_at)) return null;
  return {
    dueAt: next,
    scheduledFor: notificationTime(next, reminder.reminder_minutes_before)
  };
}
