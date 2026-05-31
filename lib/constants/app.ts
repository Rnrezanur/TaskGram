export const APP_NAME = "TaskGram";
export const APP_TAGLINE = "Never miss a task. Get reminded on Telegram.";

export const priorities = ["low", "medium", "high"] as const;
export const categories = ["personal", "study", "work", "health", "finance", "custom"] as const;
export const recurrenceTypes = ["none", "daily", "weekly", "monthly", "custom_days", "custom_weeks"] as const;
export const reminderOffsets = [0, 5, 15, 30, 60, 1440] as const;
export const snoozeOptions = [
  { label: "10 minutes", minutes: 10 },
  { label: "30 minutes", minutes: 30 },
  { label: "1 hour", minutes: 60 },
  { label: "Tomorrow", minutes: 1440 }
];
