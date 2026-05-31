"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { categories, recurrenceTypes } from "@/lib/constants/app";
import type { Reminder } from "@/lib/types";

type State = { error?: string };

export function ReminderForm({
  action,
  initial,
  telegramConnected,
  defaultTimezone
}: {
  action: (state: State | void, formData: FormData) => Promise<State | void>;
  initial?: (Reminder & { date?: string; time?: string }) | null;
  telegramConnected: boolean;
  defaultTimezone: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <Card>
      <CardContent className="p-6">
        <form action={formAction} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2"><Label htmlFor="title">Reminder title</Label><Input id="title" name="title" required defaultValue={initial?.title ?? ""} /></div>
            <div className="space-y-2 md:col-span-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" defaultValue={initial?.description ?? ""} /></div>
            <div className="space-y-2"><Label htmlFor="date">Date</Label><Input id="date" name="date" type="date" required defaultValue={initial?.date ?? ""} /></div>
            <div className="space-y-2"><Label htmlFor="time">Time</Label><Input id="time" name="time" type="time" required defaultValue={initial?.time ?? ""} /></div>
            <div className="space-y-2"><Label htmlFor="timezone">Time zone</Label><Input id="timezone" name="timezone" required defaultValue={initial?.timezone ?? defaultTimezone} /></div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select name="priority" defaultValue={initial?.priority ?? "medium"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select name="category" defaultValue={initial?.category ?? "personal"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-2"><Label htmlFor="customCategory">Custom category</Label><Input id="customCategory" name="customCategory" defaultValue={initial?.custom_category ?? ""} /></div>
            <div className="space-y-2">
              <Label>Reminder timing</Label>
              <Select name="reminderMinutesBefore" defaultValue={String(initial?.reminder_minutes_before ?? 30)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="0">At due time</SelectItem><SelectItem value="5">5 minutes before</SelectItem><SelectItem value="15">15 minutes before</SelectItem><SelectItem value="30">30 minutes before</SelectItem><SelectItem value="60">1 hour before</SelectItem><SelectItem value="1440">1 day before</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-2">
              <Label>Recurrence</Label>
              <Select name="recurrenceType" defaultValue={initial?.recurrence_type ?? "none"}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{recurrenceTypes.map((r) => <SelectItem key={r} value={r}>{r.replace("_", " ")}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-2"><Label htmlFor="recurrenceInterval">Custom interval</Label><Input id="recurrenceInterval" name="recurrenceInterval" type="number" min="1" defaultValue={initial?.recurrence_interval ?? ""} /></div>
            <div className="space-y-2"><Label htmlFor="recurrenceEndDate">Recurrence end date</Label><Input id="recurrenceEndDate" name="recurrenceEndDate" type="date" /></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input name="telegramEnabled" type="checkbox" defaultChecked={initial?.telegram_enabled ?? telegramConnected} disabled={!telegramConnected} /> Send Telegram notification</label>
          {!telegramConnected && <p className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">Connect Telegram before enabling Telegram reminders.</p>}
          <label className="flex items-center gap-2 text-sm text-muted-foreground"><input name="allowPast" type="checkbox" /> Save as overdue if this time is in the past</label>
          {state?.error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button asChild variant="outline"><Link href="/dashboard/reminders">Cancel</Link></Button>
            <Button disabled={pending}>{pending ? "Saving..." : "Save reminder"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
