export type ReminderStatus = "active" | "completed" | "archived" | "cancelled";
export type DeliveryStatus = "pending" | "processing" | "sent" | "failed" | "cancelled";
export type Priority = "low" | "medium" | "high";
export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "custom_days" | "custom_weeks";
export type NoteColor = "default" | "blue" | "green" | "amber" | "rose";
export type TransactionType = "income" | "expense";

export type Profile = {
  id: string;
  full_name: string | null;
  timezone: string;
  time_format: "12h" | "24h";
  default_reminder_minutes: number;
  telegram_notifications_enabled: boolean;
  theme: "light" | "dark" | "system";
  created_at: string;
  updated_at: string;
};

export type Reminder = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  custom_category: string | null;
  priority: Priority;
  due_at: string;
  timezone: string;
  reminder_minutes_before: number;
  telegram_enabled: boolean;
  recurrence_type: RecurrenceType;
  recurrence_interval: number | null;
  recurrence_end_at: string | null;
  next_occurrence_at: string | null;
  status: ReminderStatus;
  completed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TelegramConnection = {
  id: string;
  user_id: string;
  telegram_chat_id: number;
  telegram_username: string | null;
  telegram_first_name: string | null;
  is_active: boolean;
  connected_at: string;
  disconnected_at: string | null;
  last_test_message_at: string | null;
};

export type NotificationDelivery = {
  id: string;
  reminder_id: string;
  user_id: string;
  scheduled_for: string;
  sent_at: string | null;
  delivery_status: DeliveryStatus;
  attempt_count: number;
  telegram_message_id: number | null;
  error_message: string | null;
  snoozed_from_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Note = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  color: NoteColor;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type FinanceTransaction = {
  id: string;
  user_id: string;
  transaction_type: TransactionType;
  amount: number;
  category: string;
  description: string | null;
  transaction_date: string;
  currency: string;
  created_at: string;
  updated_at: string;
};
