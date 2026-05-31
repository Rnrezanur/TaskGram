import { formatLocalDateTime } from "@/lib/time";
import type { Reminder, Profile } from "@/lib/types";

function esc(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function reminderMessage(reminder: Reminder, profile: Profile) {
  const due = formatLocalDateTime(reminder.due_at, reminder.timezone || profile.timezone, profile.time_format);
  const category = reminder.category === "custom" ? reminder.custom_category || "Custom" : reminder.category;
  if (reminder.priority === "high") {
    return `<b>Urgent TaskGram Reminder</b>\n\n${esc(reminder.title)}\n\nDue: ${esc(due)}\nPriority: High\n\nPlease complete this task as soon as possible.`;
  }
  return `<b>TaskGram Reminder</b>\n\n${esc(reminder.title)}\n\nDue: ${esc(due)}\nPriority: ${esc(reminder.priority)}\nCategory: ${esc(category)}${reminder.description ? `\n\n${esc(reminder.description)}` : ""}`;
}

export const testMessage =
  "<b>TaskGram Test Message</b>\n\nYour Telegram connection is working correctly. Future reminders will appear here.";
