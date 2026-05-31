import { z } from "zod";
import { categories, priorities, recurrenceTypes } from "@/lib/constants/app";

export const reminderSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(140),
    description: z.string().max(2000).optional().nullable(),
    date: z.string().min(1, "Date is required"),
    time: z.string().min(1, "Time is required"),
    timezone: z.string().min(1, "Time zone is required"),
    priority: z.enum(priorities),
    category: z.enum(categories),
    customCategory: z.string().max(40).optional().nullable(),
    telegramEnabled: z.coerce.boolean(),
    reminderMinutesBefore: z.coerce.number().int().min(0),
    recurrenceType: z.enum(recurrenceTypes),
    recurrenceInterval: z.coerce.number().int().positive().optional().nullable(),
    recurrenceEndDate: z.string().optional().nullable(),
    allowPast: z.coerce.boolean().optional()
  })
  .refine((data) => data.category !== "custom" || !!data.customCategory?.trim(), {
    path: ["customCategory"],
    message: "Custom category is required"
  })
  .refine(
    (data) => !["custom_days", "custom_weeks"].includes(data.recurrenceType) || !!data.recurrenceInterval,
    { path: ["recurrenceInterval"], message: "Custom recurrence interval is required" }
  )
  .refine((data) => data.reminderMinutesBefore >= 0, {
    path: ["reminderMinutesBefore"],
    message: "Reminder timing must be a positive number"
  });

export const snoozeSchema = z.object({
  reminderId: z.string().uuid(),
  notificationId: z.string().uuid().optional(),
  minutes: z.coerce.number().int().positive()
});

export const settingsSchema = z.object({
  fullName: z.string().min(2),
  timezone: z.string().min(1),
  timeFormat: z.enum(["12h", "24h"]),
  defaultReminderMinutes: z.coerce.number().int().min(0),
  telegramNotificationsEnabled: z.coerce.boolean(),
  theme: z.enum(["system", "light", "dark"])
});
