import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram/api";
import { hashToken, verifyTelegramSecret } from "@/lib/telegram/token";
import { invariantEnv } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 30;
export const preferredRegion = "sin1";

type TelegramMessage = {
  message?: {
    chat: { id: number };
    from?: { username?: string; first_name?: string };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: { id: number };
    data?: string;
    message?: { chat: { id: number }; message_id: number; text?: string };
  };
};

async function answerCallback(id: string, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ callback_query_id: id, text })
    });
  } catch {
    // Callback acknowledgement failure should not leak implementation details.
  }
}

async function editTelegramMessage(chatId: number, messageId: number, text: string) {
  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageText`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: "HTML"
      })
    });
  } catch {
    // Editing the already-sent message is a convenience; callback state is still updated in the database.
  }
}

function miniAppMarkup() {
  return {
    inline_keyboard: [[
      {
        text: "Open TaskGram",
        web_app: { url: `${invariantEnv("NEXT_PUBLIC_APP_URL")}/telegram/workspace` }
      }
    ]]
  };
}

export async function POST(request: NextRequest) {
  if (!verifyTelegramSecret(request.headers.get("x-telegram-bot-api-secret-token"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = (await request.json()) as TelegramMessage;
  const supabase = createServiceClient();

  try {
    if (update.callback_query?.data) {
      const chatId = update.callback_query.message?.chat.id ?? update.callback_query.from.id;
      const [action, targetId] = update.callback_query.data.split(":");
      const { data: connection } = await supabase.from("telegram_connections").select("user_id").eq("telegram_chat_id", chatId).eq("is_active", true).maybeSingle();
      if (!connection) {
        await answerCallback(update.callback_query.id, "Telegram is not connected to TaskGram.");
        return NextResponse.json({ ok: true });
      }
      if (action === "complete" || action === "complete_delivery") {
        let reminderId = targetId;
        let occurrenceDueAt: string | null = null;
        if (action === "complete_delivery") {
          const { data: delivery } = await supabase
            .from("notification_deliveries")
            .select("reminder_id,scheduled_for")
            .eq("id", targetId)
            .eq("user_id", connection.user_id)
            .maybeSingle();
          if (!delivery) {
            await answerCallback(update.callback_query.id, "This reminder notification is unavailable.");
            return NextResponse.json({ ok: true });
          }
          reminderId = delivery.reminder_id;
          const { data: reminderTiming } = await supabase.from("reminders").select("reminder_minutes_before").eq("id", reminderId).eq("user_id", connection.user_id).maybeSingle();
          occurrenceDueAt = new Date(new Date(delivery.scheduled_for).getTime() + (reminderTiming?.reminder_minutes_before ?? 0) * 60_000).toISOString();
        }
        const { data: reminder } = await supabase.from("reminders").select("status,recurrence_type,due_at").eq("id", reminderId).eq("user_id", connection.user_id).maybeSingle();
        if (!reminder || reminder.status === "completed") {
          await answerCallback(update.callback_query.id, "This reminder is already completed or unavailable.");
          return NextResponse.json({ ok: true });
        }
        let occurrenceQuery = supabase
          .from("task_occurrences")
          .select("id")
          .eq("reminder_id", reminderId)
          .eq("user_id", connection.user_id)
          .eq("status", "pending");
        occurrenceQuery = occurrenceDueAt
          ? occurrenceQuery.eq("due_at", occurrenceDueAt)
          : occurrenceQuery.lte("due_at", new Date().toISOString()).order("due_at", { ascending: false }).limit(1);
        const { data: occurrence } = await occurrenceQuery.maybeSingle();
        if (occurrence) {
          await supabase.from("task_occurrences").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", occurrence.id).eq("user_id", connection.user_id);
        }
        if (reminder.recurrence_type === "none") {
          await supabase.from("reminders").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", reminderId).eq("user_id", connection.user_id);
          await supabase.from("notification_deliveries").update({ delivery_status: "cancelled" }).eq("reminder_id", reminderId).eq("delivery_status", "pending");
        }
        await answerCallback(update.callback_query.id, "Marked complete.");
        if (update.callback_query.message?.message_id) {
          await editTelegramMessage(chatId, update.callback_query.message.message_id, `${update.callback_query.message.text ?? "TaskGram reminder"}\n\nCompleted in TaskGram.`);
        }
      }
      if (action === "snooze10") {
        await supabase.from("notification_deliveries").insert({ reminder_id: targetId, user_id: connection.user_id, scheduled_for: new Date(Date.now() + 10 * 60_000).toISOString(), delivery_status: "pending" });
        await answerCallback(update.callback_query.id, "Snoozed for 10 minutes.");
      }
      return NextResponse.json({ ok: true });
    }

    const message = update.message;
    if (!message?.chat.id) return NextResponse.json({ ok: true });
    const chatId = message.chat.id;
    const text = message.text ?? "";

    if (text.startsWith("/start ")) {
      const rawToken = text.replace("/start", "").trim();
      const tokenHash = hashToken(rawToken);
      const { data: token } = await supabase
        .from("telegram_link_tokens")
        .select("id,user_id,expires_at,used_at")
        .eq("token_hash", tokenHash)
        .maybeSingle();
      if (!token || token.used_at || new Date(token.expires_at).getTime() < Date.now()) {
        await sendTelegramMessage(chatId, "This TaskGram connection link is expired or has already been used. Please generate a new link from the website.");
        return NextResponse.json({ ok: true });
      }
      const { data: existing } = await supabase.from("telegram_connections").select("user_id").eq("telegram_chat_id", chatId).eq("is_active", true).maybeSingle();
      if (existing && existing.user_id !== token.user_id) {
        await sendTelegramMessage(chatId, "This Telegram chat is already connected to another TaskGram account. Disconnect it first before linking a new account.");
        return NextResponse.json({ ok: true });
      }
      await supabase.from("telegram_connections").upsert({
        user_id: token.user_id,
        telegram_chat_id: chatId,
        telegram_username: message.from?.username ?? null,
        telegram_first_name: message.from?.first_name ?? null,
        is_active: true,
        connected_at: new Date().toISOString(),
        disconnected_at: null
      }, { onConflict: "user_id" });
      await supabase.from("telegram_link_tokens").update({ used_at: new Date().toISOString() }).eq("id", token.id);
      await sendTelegramMessage(chatId, "Your Telegram account is now connected to TaskGram. You will receive your reminders here.");
      return NextResponse.json({ ok: true });
    }

    if (text.startsWith("/help")) {
      await sendTelegramMessage(chatId, "TaskGram commands:\n/start - connect from a secure website link\n/app - open your TaskGram workspace\n/status - check connection\n/disconnect - disconnect Telegram\n\nThe workspace lets you manage tasks, notes, income, and expenses without leaving Telegram.", miniAppMarkup());
    } else if (text.startsWith("/app")) {
      await sendTelegramMessage(chatId, "Open your TaskGram workspace to manage tasks, notes, income, and expenses.", miniAppMarkup());
    } else if (text.startsWith("/status")) {
      const { data } = await supabase.from("telegram_connections").select("id").eq("telegram_chat_id", chatId).eq("is_active", true).maybeSingle();
      await sendTelegramMessage(chatId, data ? "Your Telegram account is actively connected to TaskGram." : "This Telegram chat is not connected to TaskGram.");
    } else if (text.startsWith("/disconnect")) {
      await supabase.from("telegram_connections").update({ is_active: false, disconnected_at: new Date().toISOString() }).eq("telegram_chat_id", chatId);
      await sendTelegramMessage(chatId, "Telegram has been disconnected from TaskGram.");
    } else if (text.startsWith("/start")) {
      await sendTelegramMessage(chatId, "Welcome to TaskGram.\n\nConnect your TaskGram account from the website, then use the workspace to manage your day directly from Telegram.", miniAppMarkup());
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
