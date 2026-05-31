import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { updateSettingsAction } from "@/lib/actions/settings";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  return (
    <div className="space-y-5"><div><h1 className="text-3xl font-bold">Settings</h1><p className="text-muted-foreground">Profile, time zone, defaults, theme, and account controls.</p></div>
      <Card><CardHeader><CardTitle>Preferences</CardTitle></CardHeader><CardContent>
        <form action={updateSettingsAction} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="fullName">Full name</Label><Input id="fullName" name="fullName" defaultValue={profile?.full_name ?? ""} required /></div>
          <div className="space-y-2"><Label>Email</Label><Input value={user!.email ?? ""} readOnly /></div>
          <div className="space-y-2"><Label htmlFor="timezone">Default time zone</Label><Input id="timezone" name="timezone" defaultValue={profile?.timezone ?? "Asia/Dhaka"} required /></div>
          <div className="space-y-2"><Label>Preferred time format</Label><select name="timeFormat" defaultValue={profile?.time_format ?? "12h"} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="12h">12-hour</option><option value="24h">24-hour</option></select></div>
          <div className="space-y-2"><Label htmlFor="defaultReminderMinutes">Default reminder timing</Label><Input id="defaultReminderMinutes" name="defaultReminderMinutes" type="number" min="0" defaultValue={profile?.default_reminder_minutes ?? 30} /></div>
          <div className="space-y-2"><Label>Theme</Label><select name="theme" defaultValue={profile?.theme ?? "system"} className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></div>
          <label className="flex items-center gap-2 text-sm md:col-span-2"><input name="telegramNotificationsEnabled" type="checkbox" defaultChecked={profile?.telegram_notifications_enabled ?? true} /> Enable Telegram notifications by default</label>
          <Button className="md:w-fit">Save settings</Button>
        </form>
      </CardContent></Card>
      <Card className="border-destructive/40"><CardHeader><CardTitle>Account deletion</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Account deletion should be handled from Supabase Auth admin tooling or a dedicated support workflow before production launch.</p></CardContent></Card>
    </div>
  );
}
