import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

type Delivery = {
  id: string;
  reminder_id: string;
  user_id: string;
  attempt_count: number;
};

type Reminder = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  custom_category: string | null;
  priority: string;
  due_at: string;
  timezone: string;
  reminder_minutes_before: number;
  recurrence_type: string;
  recurrence_interval: number | null;
  recurrence_end_at: string | null;
};

function addOccurrence(date: Date, type: string, interval = 1) {
  const next = new Date(date);
  if (type === "daily") next.setUTCDate(next.getUTCDate() + 1);
  else if (type === "weekly") next.setUTCDate(next.getUTCDate() + 7);
  else if (type === "monthly") next.setUTCMonth(next.getUTCMonth() + 1);
  else if (type === "custom_days") next.setUTCDate(next.getUTCDate() + interval);
  else if (type === "custom_weeks") next.setUTCDate(next.getUTCDate() + interval * 7);
  else return null;
  return next;
}

function notificationTime(due: Date, minutes: number) {
  return new Date(due.getTime() - minutes * 60_000);
}

function message(reminder: Reminder) {
  const due = new Intl.DateTimeFormat("en", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: reminder.timezone
  }).format(new Date(reminder.due_at));
  if (reminder.priority === "high") {
    return `<b>Urgent TaskGram Reminder</b>\n\n${reminder.title}\n\nDue: ${due}\nPriority: High\n\nPlease complete this task as soon as possible.`;
  }
  return `<b>TaskGram Reminder</b>\n\n${reminder.title}\n\nDue: ${due}\nPriority: ${reminder.priority}\nCategory: ${reminder.custom_category || reminder.category}${reminder.description ? `\n\n${reminder.description}` : ""}`;
}

Deno.serve(async (req) => {
  const auth = req.headers.get("authorization")?.replace("Bearer ", "");
  if (auth !== Deno.env.get("CRON_AUTH_SECRET")) return new Response("Unauthorized", { status: 401 });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false }
  });
  const { data: deliveries, error: claimError } = await supabase.rpc("claim_due_notifications", { batch_size: 25 });
  if (claimError) return Response.json({ ok: false, error: claimError.message }, { status: 500 });

  const results = [];
  for (const delivery of (deliveries ?? []) as Delivery[]) {
    const { data: reminder } = await supabase.from("reminders").select("*").eq("id", delivery.reminder_id).single<Reminder>();
    const { data: profile } = await supabase.from("profiles").select("time_format").eq("id", delivery.user_id).single();
    const { data: connection } = await supabase.from("telegram_connections").select("telegram_chat_id").eq("user_id", delivery.user_id).eq("is_active", true).single();
    if (!reminder || !profile || !connection) {
      await supabase.from("notification_deliveries").update({ delivery_status: "failed", error_message: "Missing reminder, profile, or active Telegram connection" }).eq("id", delivery.id);
      continue;
    }
    try {
      const response = await fetch(`https://api.telegram.org/bot${Deno.env.get("TELEGRAM_BOT_TOKEN")}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: connection.telegram_chat_id,
          text: message(reminder),
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [[
              { text: "Mark Complete", callback_data: `complete_delivery:${delivery.id}` },
              { text: "Mark Incomplete", callback_data: `incomplete_delivery:${delivery.id}` }
            ], [
              { text: "Snooze 10 Minutes", callback_data: `snooze10:${reminder.id}` }
            ], [{ text: "Open Website", url: Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://taskgram.app" }]]
          }
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.description || "Telegram send failed");
      await supabase.from("notification_deliveries").update({ delivery_status: "sent", sent_at: new Date().toISOString(), telegram_message_id: payload.result.message_id, error_message: null }).eq("id", delivery.id);
      const next = addOccurrence(new Date(reminder.due_at), reminder.recurrence_type, reminder.recurrence_interval ?? 1);
      if (next && (!reminder.recurrence_end_at || next <= new Date(reminder.recurrence_end_at))) {
        await supabase.from("reminders").update({ due_at: next.toISOString(), next_occurrence_at: next.toISOString() }).eq("id", reminder.id);
        await supabase.from("notification_deliveries").insert({ reminder_id: reminder.id, user_id: delivery.user_id, scheduled_for: notificationTime(next, reminder.reminder_minutes_before).toISOString(), delivery_status: "pending" });
      }
      results.push({ id: delivery.id, status: "sent" });
    } catch (error) {
      const permanent = String(error).includes("blocked") || String(error).includes("chat not found");
      if (permanent) await supabase.from("telegram_connections").update({ is_active: false, disconnected_at: new Date().toISOString() }).eq("user_id", delivery.user_id);
      await supabase.from("notification_deliveries").update({
        delivery_status: delivery.attempt_count >= 3 || permanent ? "failed" : "pending",
        error_message: error instanceof Error ? error.message : "Unknown Telegram error"
      }).eq("id", delivery.id);
      results.push({ id: delivery.id, status: "failed" });
    }
  }
  return Response.json({ ok: true, processed: results.length, results });
});
