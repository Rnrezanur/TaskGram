import crypto from "node:crypto";

export function generateLinkToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function verifyTelegramSecret(headerValue: string | null) {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  return Boolean(expected && headerValue && crypto.timingSafeEqual(Buffer.from(headerValue), Buffer.from(expected)));
}
