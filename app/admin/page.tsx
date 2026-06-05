import Link from "next/link";
import { Shield, Users, ListChecks, Bell, MessageCircle } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";

type ProfileRow = {
  id: string;
  full_name: string | null;
  timezone: string;
  created_at: string;
};

type ReminderRow = {
  user_id: string;
  status: string;
};

type ConnectionRow = {
  user_id: string;
  is_active: boolean;
  telegram_username: string | null;
  connected_at: string;
};

export const preferredRegion = "sin1";

export default async function AdminPage() {
  const { serviceSupabase } = await requireAdmin();

  const [usersResult, profilesResult, remindersResult, deliveriesResult, connectionsResult] = await Promise.all([
    serviceSupabase.auth.admin.listUsers({ page: 1, perPage: 100 }),
    serviceSupabase.from("profiles").select("id,full_name,timezone,created_at").order("created_at", { ascending: false }).returns<ProfileRow[]>(),
    serviceSupabase.from("reminders").select("user_id,status").returns<ReminderRow[]>(),
    serviceSupabase.from("notification_deliveries").select("id,delivery_status", { count: "exact", head: true }),
    serviceSupabase.from("telegram_connections").select("user_id,is_active,telegram_username,connected_at").returns<ConnectionRow[]>()
  ]);

  const users = usersResult.data.users;
  const profiles = profilesResult.data ?? [];
  const reminders = remindersResult.data ?? [];
  const connections = connectionsResult.data ?? [];
  const activeConnections = connections.filter((connection) => connection.is_active);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-bold">Admin</h1>
            <p className="text-muted-foreground">View users, Telegram connections, reminders, and delivery volume.</p>
          </div>
          <Button asChild variant="outline"><Link href="/dashboard">Back to app</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Users" value={users.length} icon={Users} />
        <StatCard label="Tasks" value={reminders.length} icon={ListChecks} />
        <StatCard label="Deliveries" value={deliveriesResult.count ?? 0} icon={Bell} />
        <StatCard label="Telegram linked" value={activeConnections.length} icon={MessageCircle} />
      </div>

      <Card>
        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Email</th>
                <th className="p-3">Tasks</th>
                <th className="p-3">Completed</th>
                <th className="p-3">Telegram</th>
                <th className="p-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const profile = profiles.find((row) => row.id === user.id);
                const userReminders = reminders.filter((reminder) => reminder.user_id === user.id);
                const connection = connections.find((row) => row.user_id === user.id && row.is_active);
                return (
                  <tr key={user.id} className="border-t">
                    <td className="p-3 font-medium">{profile?.full_name || user.user_metadata?.full_name || "TaskGram user"}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">{userReminders.length}</td>
                    <td className="p-3">{userReminders.filter((reminder) => reminder.status === "completed").length}</td>
                    <td className="p-3">{connection ? connection.telegram_username || "Connected" : "Not connected"}</td>
                    <td className="p-3">{new Date(user.created_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
