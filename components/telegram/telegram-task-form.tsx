"use client";

import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        ready: () => void;
        expand: () => void;
        close: () => void;
        colorScheme: "light" | "dark";
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        HapticFeedback?: { notificationOccurred: (type: "success" | "error") => void };
      };
    };
  }
}

function defaultParts() {
  const date = new Date(Date.now() + 30 * 60_000);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return { date: local.toISOString().slice(0, 10), time: local.toISOString().slice(11, 16) };
}

export function TelegramTaskForm() {
  const [defaults] = useState(() => defaultParts());
  const [initData] = useState(() => typeof window === "undefined" ? "" : window.Telegram?.WebApp.initData ?? "");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) return;
    webApp.ready();
    webApp.expand();
  }, []);

  async function submit(formData: FormData) {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/telegram/mini-app/reminders", {
        method: "POST",
        headers: { "content-type": "application/json", "x-telegram-init-data": initData },
        body: JSON.stringify(Object.fromEntries(formData))
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not create task.");
      setSuccess(true);
      window.Telegram?.WebApp.HapticFeedback?.notificationOccurred("success");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create task.");
      window.Telegram?.WebApp.HapticFeedback?.notificationOccurred("error");
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto flex min-h-[75vh] max-w-md flex-col items-center justify-center text-center">
        <CheckCircle2 className="h-14 w-14 text-emerald-500" />
        <h1 className="mt-5 text-2xl font-bold">Task created</h1>
        <p className="mt-2 text-sm text-muted-foreground">TaskGram will send the reminder here on Telegram.</p>
        <div className="mt-6 flex gap-2">
          <Button variant="outline" onClick={() => setSuccess(false)}><Plus className="h-4 w-4" />Add another</Button>
          <Button onClick={() => window.Telegram?.WebApp.close()}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground"><CalendarClock className="h-5 w-5" /></div>
        <div><h1 className="text-2xl font-bold">Add task</h1><p className="text-sm text-muted-foreground">Create a Telegram reminder in seconds.</p></div>
      </div>
      <Card>
        <CardContent className="p-4">
          <form action={submit} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="title">Task title</Label><Input id="title" name="title" placeholder="What needs to be done?" required autoFocus /></div>
            <div className="space-y-2"><Label htmlFor="description">Notes</Label><Textarea id="description" name="description" placeholder="Optional details" className="min-h-20" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="date">Date</Label><Input id="date" name="date" type="date" defaultValue={defaults.date} required /></div>
              <div className="space-y-2"><Label htmlFor="time">Time</Label><Input id="time" name="time" type="time" defaultValue={defaults.time} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="priority">Priority</Label><select id="priority" name="priority" defaultValue="medium" className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
              <div className="space-y-2"><Label htmlFor="category">Category</Label><select id="category" name="category" defaultValue="personal" className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="personal">Personal</option><option value="study">Study</option><option value="work">Work</option><option value="health">Health</option><option value="finance">Finance</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="reminderMinutesBefore">Remind me</Label><select id="reminderMinutesBefore" name="reminderMinutesBefore" defaultValue="0" className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="0">At due time</option><option value="5">5 min before</option><option value="15">15 min before</option><option value="30">30 min before</option><option value="60">1 hour before</option></select></div>
              <div className="space-y-2"><Label htmlFor="recurrenceType">Repeat</Label><select id="recurrenceType" name="recurrenceType" defaultValue="none" className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="none">Never</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div>
            </div>
            {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            {!initData && <p className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">Open this form from the TaskGram Telegram bot to create tasks.</p>}
            <Button className="w-full" size="lg" disabled={pending || !initData}><Send className="h-4 w-4" />{pending ? "Creating task..." : "Create task"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
