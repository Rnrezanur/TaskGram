import crypto from "node:crypto";
import { invariantEnv } from "@/lib/utils";

type TelegramMiniAppUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
};

export function verifyMiniAppInitData(initData: string, maxAgeSeconds = 3600) {
  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  const authDate = Number(params.get("auth_date"));
  const userJson = params.get("user");

  if (!receivedHash || !authDate || !userJson) throw new Error("Invalid Telegram Mini App session.");
  if (Math.floor(Date.now() / 1000) - authDate > maxAgeSeconds) throw new Error("Telegram Mini App session expired.");

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(invariantEnv("TELEGRAM_BOT_TOKEN")).digest();
  const calculatedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const receivedBuffer = Buffer.from(receivedHash, "hex");
  const calculatedBuffer = Buffer.from(calculatedHash, "hex");
  if (receivedBuffer.length !== calculatedBuffer.length || !crypto.timingSafeEqual(receivedBuffer, calculatedBuffer)) {
    throw new Error("Telegram Mini App signature is invalid.");
  }

  return JSON.parse(userJson) as TelegramMiniAppUser;
}
