import { CheckCircle2, MessageCircle } from "lucide-react";
import { ConnectTelegramButton, TelegramConnectionActions } from "@/components/telegram/telegram-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { TelegramConnection } from "@/lib/types";

export default async function TelegramPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: connection } = await supabase.from("telegram_connections").select("*").eq("user_id", user!.id).eq("is_active", true).maybeSingle<TelegramConnection>();
  return (
    <div className="space-y-5">
      <div><h1 className="text-3xl font-bold">Telegram connection</h1><p className="text-muted-foreground">Securely link Telegram without manually entering a chat ID.</p></div>
      <Card className="shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" />Connection status</CardTitle></CardHeader><CardContent className="space-y-5">
        {connection ? (
          <><div className="rounded-lg border bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="mb-2 h-5 w-5" />Telegram is connected as {connection.telegram_username || connection.telegram_first_name || "your Telegram account"} since {new Date(connection.connected_at).toLocaleString()}.</div><TelegramConnectionActions /></>
        ) : (
          <div className="space-y-5"><p className="text-muted-foreground">Telegram lets TaskGram send reminders even when you are away from the website.</p><ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground"><li>Click Connect Telegram.</li><li>Telegram will open.</li><li>Press Start in the bot chat.</li><li>Return to TaskGram and refresh this page.</li></ol><ConnectTelegramButton /></div>
        )}
      </CardContent></Card>
    </div>
  );
}
