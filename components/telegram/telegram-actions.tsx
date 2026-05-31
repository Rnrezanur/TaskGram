"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createTelegramLinkAction, disconnectTelegramAction, sendTestTelegramAction } from "@/lib/actions/telegram";

export function ConnectTelegramButton() {
  const [pending, startTransition] = useTransition();
  return <Button disabled={pending} onClick={() => startTransition(async () => {
    const result = await createTelegramLinkAction();
    if (result?.error) toast.error(result.error);
    if (result?.url) window.open(result.url, "_blank", "noopener,noreferrer");
  })}>{pending ? "Creating link..." : "Connect Telegram"}</Button>;
}

export function TelegramConnectionActions() {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button disabled={pending} onClick={() => startTransition(async () => {
        const result = await sendTestTelegramAction();
        if (result?.error) toast.error(result.error);
        if (result?.success) toast.success(result.success);
      })}>Send Test Message</Button>
      <Button disabled={pending} variant="destructive" onClick={() => startTransition(async () => {
        await disconnectTelegramAction();
        toast.success("Telegram disconnected.");
      })}>Disconnect Telegram</Button>
    </div>
  );
}
