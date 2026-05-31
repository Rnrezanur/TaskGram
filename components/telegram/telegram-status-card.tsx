import { MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { TelegramConnection } from "@/lib/types";

export function TelegramStatusCard({ connection }: { connection: TelegramConnection | null }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3"><MessageCircle className="h-6 w-6 text-primary" /><div><h3 className="font-semibold">Telegram</h3><p className="text-sm text-muted-foreground">{connection?.is_active ? `Connected as ${connection.telegram_username || connection.telegram_first_name || "Telegram user"}` : "Not connected"}</p></div></div>
      </CardContent>
    </Card>
  );
}
