import { addDays, addMonths, addWeeks } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { RecurrenceType } from "@/lib/types";

export function zonedDateTimeToUtc(date: string, time: string, timezone: string) {
  return fromZonedTime(`${date}T${time}:00`, timezone);
}

export function notificationTime(dueAt: Date, minutesBefore: number) {
  return new Date(dueAt.getTime() - minutesBefore * 60_000);
}

export function localDateParts(iso: string, timezone: string) {
  return {
    date: formatInTimeZone(iso, timezone, "yyyy-MM-dd"),
    time: formatInTimeZone(iso, timezone, "HH:mm")
  };
}

export function formatLocalDateTime(iso: string, timezone: string, timeFormat: "12h" | "24h" = "12h") {
  return formatInTimeZone(iso, timezone, timeFormat === "12h" ? "d MMMM yyyy 'at' h:mm a" : "d MMMM yyyy 'at' HH:mm");
}

export function nextOccurrence(currentDueAt: Date, type: RecurrenceType, interval = 1) {
  if (type === "daily") return addDays(currentDueAt, 1);
  if (type === "weekly") return addWeeks(currentDueAt, 1);
  if (type === "monthly") return addMonths(currentDueAt, 1);
  if (type === "custom_days") return addDays(currentDueAt, interval);
  if (type === "custom_weeks") return addWeeks(currentDueAt, interval);
  return null;
}

export function shortDate(iso: string, timezone: string) {
  return formatInTimeZone(iso, timezone, "MMM d, h:mm a");
}

export function todayKey(timezone: string) {
  return formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");
}
