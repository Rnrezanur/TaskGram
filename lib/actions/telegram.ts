"use server";

import { addMinutes, subMinutes } from "date-fns";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendTelegramMessage, telegramDeepLink } from "@/lib/telegram/api";
import { testMessage } from "@/lib/telegram/messages";
import { generateLinkToken, hashToken } from "@/lib/telegram/token";

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createTelegramLinkAction() {
  const { supabase, user } = await requireUser();
  const recent = await supabase
    .from("telegram_link_tokens")
    .select("created_at")
    .eq("user_id", user.id)
    .gte("created_at", subMinutes(new Date(), 1).toISOString());
  if ((recent.data?.length ?? 0) >= 3) return { error: "Please wait a moment before generating another link." };

  const token = generateLinkToken();
  const { error } = await supabase.from("telegram_link_tokens").insert({
    user_id: user.id,
    token_hash: hashToken(token),
    expires_at: addMinutes(new Date(), 10).toISOString()
  });
  if (error) return { error: error.message };
  return { url: telegramDeepLink(token) };
}

export async function sendTestTelegramAction() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("telegram_connections")
    .select("telegram_chat_id,last_test_message_at")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();
  if (error || !data) return { error: "Telegram is not connected." };
  if (data.last_test_message_at && new Date(data.last_test_message_at) > subMinutes(new Date(), 1)) {
    return { error: "Please wait a minute before sending another test." };
  }
  try {
    await sendTelegramMessage(Number(data.telegram_chat_id), testMessage);
    await supabase.from("telegram_connections").update({ last_test_message_at: new Date().toISOString() }).eq("user_id", user.id);
    revalidatePath("/dashboard/telegram");
    return { success: "Test message sent to Telegram." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Telegram test failed." };
  }
}

export async function disconnectTelegramAction() {
  const { supabase, user } = await requireUser();
  await supabase
    .from("telegram_connections")
    .update({ is_active: false, disconnected_at: new Date().toISOString() })
    .eq("user_id", user.id);
  revalidatePath("/dashboard/telegram");
}

export async function disconnectTelegramByChat(chatId: number) {
  const supabase = createServiceClient();
  await supabase
    .from("telegram_connections")
    .update({ is_active: false, disconnected_at: new Date().toISOString() })
    .eq("telegram_chat_id", chatId)
    .eq("is_active", true);
}
