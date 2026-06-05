import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram/api";
import { hashToken, verifyTelegramSecret } from "@/lib/telegram/token";

export const runtime = "nodejs";
export const maxDuration = 30;

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
    message?: { chat: { id: number } };
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

export async function POST(request: NextRequest) {
  if (!verifyTelegramSecret(request.headers.get("x-telegram-bot-api-secret-token"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = (await request.json()) as TelegramMessage;
  const supabase = createServiceClient();

  try {
    if (update.callback_query?.data) {
      const chatId = update.callback_query.message?.chat.id ?? update.callback_query.from.id;
      const [action, reminderId] = update.callback_query.data.split(":");
      const { data: connection } = await supabase.from("telegram_connections").select("user_id").eq("telegram_chat_id", chatId).eq("is_active", true).maybeSingle();
      if (!connection) {
        await answerCallback(update.callback_query.id, "Telegram is not connected to TaskGram.");
        return NextResponse.json({ ok: true });
      }
      if (action === "complete") {
        const { data: reminder } = await supabase.from("reminders").select("status").eq("id", reminderId).eq("user_id", connection.user_id).maybeSingle();
        if (!reminder || reminder.status === "completed") {
          await answerCallback(update.callback_query.id, "This reminder is already completed or unavailable.");
          return NextResponse.json({ ok: true });
        }
        await supabase.from("reminders").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", reminderId).eq("user_id", connection.user_id);
        await supabase.from("notification_deliveries").update({ delivery_status: "cancelled" }).eq("reminder_id", reminderId).eq("delivery_status", "pending");
        await answerCallback(update.callback_query.id, "Marked complete.");
      }
      if (action === "snooze10") {
        await supabase.from("notification_deliveries").insert({ reminder_id: reminderId, user_id: connection.user_id, scheduled_for: new Date(Date.now() + 10 * 60_000).toISOString(), delivery_status: "pending" });
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
      await sendTelegramMessage(chatId, "TaskGram commands:\n/start - connect from a secure website link\n/status - check connection\n/disconnect - disconnect Telegram\n\nManage reminders from the TaskGram website.");
    } else if (text.startsWith("/status")) {
      const { data } = await supabase.from("telegram_connections").select("id").eq("telegram_chat_id", chatId).eq("is_active", true).maybeSingle();
      await sendTelegramMessage(chatId, data ? "Your Telegram account is actively connected to TaskGram." : "This Telegram chat is not connected to TaskGram.");
    } else if (text.startsWith("/disconnect")) {
      await supabase.from("telegram_connections").update({ is_active: false, disconnected_at: new Date().toISOString() }).eq("telegram_chat_id", chatId);
      await sendTelegramMessage(chatId, "Telegram has been disconnected from TaskGram.");
    } else if (text.startsWith("/start")) {
      await sendTelegramMessage(chatId, "Welcome to TaskGram.\n\nConnect your TaskGram account from the website to start receiving reminder notifications.");
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
