import { invariantEnv } from "@/lib/utils";

type TelegramResponse<T> = { ok: true; result: T } | { ok: false; description: string; error_code?: number };

export async function telegramApi<T>(method: string, payload: Record<string, unknown>) {
  const response = await fetch(`https://api.telegram.org/bot${invariantEnv("TELEGRAM_BOT_TOKEN")}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store"
  });
  const data = (await response.json()) as TelegramResponse<T>;
  if (!data.ok) throw new Error(data.description);
  return data.result;
}

export async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: Record<string, unknown>) {
  return telegramApi<{ message_id: number }>("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: replyMarkup
  });
}

export function telegramDeepLink(token: string) {
  return `https://t.me/${invariantEnv("TELEGRAM_BOT_USERNAME")}?start=${encodeURIComponent(token)}`;
}
