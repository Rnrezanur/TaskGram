import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatLocalDateTime } from "@/lib/time";

type Row = { id: string; scheduled_for: string; sent_at: string | null; delivery_status: string; error_message: string | null; reminders: { title: string; timezone: string } | null };

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: notificationRows } = await supabase
    .from("notification_deliveries")
    .select("id,scheduled_for,sent_at,delivery_status,error_message,reminders(title,timezone)")
    .eq("user_id", user!.id)
    .order("scheduled_for", { ascending: false })
    .returns<Row[]>();
  const rows = notificationRows ?? [];
  return (
    <div className="space-y-5"><div><h1 className="text-3xl font-bold">Notification history</h1><p className="text-muted-foreground">Pending, sent, failed, and cancelled Telegram delivery events.</p></div>
      <Card><CardHeader><CardTitle>Deliveries</CardTitle></CardHeader><CardContent className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm"><thead className="text-muted-foreground"><tr><th className="p-3">Reminder</th><th className="p-3">Scheduled</th><th className="p-3">Sent</th><th className="p-3">Status</th><th className="p-3">Error</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t"><td className="p-3 font-medium"><Link href={`/dashboard/reminders/${row.id}`}>{row.reminders?.title ?? "Reminder"}</Link></td><td className="p-3">{formatLocalDateTime(row.scheduled_for, row.reminders?.timezone ?? "UTC")}</td><td className="p-3">{row.sent_at ? formatLocalDateTime(row.sent_at, row.reminders?.timezone ?? "UTC") : "-"}</td><td className="p-3">{row.delivery_status}</td><td className="p-3 text-destructive">{row.error_message ?? "-"}</td></tr>)}</tbody></table>
        {!rows.length && <p className="p-4 text-sm text-muted-foreground">No notification history yet.</p>}
      </CardContent></Card>
    </div>
  );
}
