"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  BarChart3,
  Check,
  CircleX,
  CircleDollarSign,
  Clock3,
  ListTodo,
  Loader2,
  NotebookPen,
  Pin,
  Plus,
  RefreshCw,
  Trash2,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Tab = "tasks" | "notes" | "money" | "records";
type Task = {
  id: string;
  title: string;
  description: string | null;
  due_at: string;
  timezone: string;
  priority: "low" | "medium" | "high";
  category: string;
  recurrence_type: string;
};
type Note = {
  id: string;
  title: string;
  content: string;
  color: string;
  is_pinned: boolean;
};
type Transaction = {
  id: string;
  transaction_type: "income" | "expense";
  amount: number;
  category: string;
  description: string | null;
  transaction_date: string;
  currency: string;
};
type TaskRecord = {
  id: string;
  reminder_id: string | null;
  due_at: string;
  status: "pending" | "completed" | "incomplete" | "cancelled";
  completed_at: string | null;
  title: string;
  category: string;
};
type WorkspaceData = {
  profile: { full_name: string | null; timezone: string };
  tasks: Task[];
  notes: Note[];
  transactions: Transaction[];
  records: TaskRecord[];
  generatedAt: string;
};

function futureParts() {
  const date = new Date(Date.now() + 30 * 60_000);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return { date: local.toISOString().slice(0, 10), time: local.toISOString().slice(11, 16) };
}

function today() {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">{children}</div>;
}

export function TelegramWorkspace() {
  const [tab, setTab] = useState<Tab>("tasks");
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [initData, setInitData] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const defaults = useMemo(() => futureParts(), []);

  const api = useCallback(async (url: string, options?: RequestInit) => {
    const response = await fetch(url, {
      ...options,
      headers: { "content-type": "application/json", "x-telegram-init-data": initData, ...options?.headers }
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "TaskGram could not complete that action.");
    return result;
  }, [initData]);

  const refresh = useCallback(async () => {
    if (!initData) return;
    setError("");
    try {
      setData(await api("/api/telegram/mini-app/workspace"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load TaskGram.");
    } finally {
      setLoading(false);
    }
  }, [api, initData]);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) {
      const timer = window.setTimeout(() => {
        setLoading(false);
        setError("Open TaskGram from the Telegram bot.");
      }, 0);
      return () => window.clearTimeout(timer);
    }
    webApp.ready();
    webApp.expand();
    const timer = window.setTimeout(() => setInitData(webApp.initData), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function mutate(key: string, payload: Record<string, unknown>) {
    setBusy(key);
    setError("");
    try {
      await api("/api/telegram/mini-app/workspace", { method: "POST", body: JSON.stringify(payload) });
      window.Telegram?.WebApp.HapticFeedback?.notificationOccurred("success");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action failed.");
      window.Telegram?.WebApp.HapticFeedback?.notificationOccurred("error");
    } finally {
      setBusy("");
    }
  }

  async function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy("new-task");
    setError("");
    try {
      await api("/api/telegram/mini-app/reminders", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      form.reset();
      setShowTaskForm(false);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create task.");
    } finally {
      setBusy("");
    }
  }

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await mutate("new-note", { resource: "note", action: "create", ...Object.fromEntries(new FormData(form)) });
    form.reset();
  }

  async function submitTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    await mutate("new-transaction", { resource: "finance", action: "create", ...Object.fromEntries(new FormData(form)) });
    form.reset();
  }

  const totals = useMemo(() => data?.transactions.reduce(
    (sum, item) => ({ ...sum, [item.transaction_type]: sum[item.transaction_type] + Number(item.amount) }),
    { income: 0, expense: 0 }
  ) ?? { income: 0, expense: 0 }, [data]);
  const recordTotals = useMemo(() => data?.records.reduce((sum, record) => {
    if (record.status === "cancelled") return sum;
    const status = record.status === "completed" ? "completed" : record.status === "incomplete" || new Date(record.due_at).getTime() < new Date(data.generatedAt).getTime() ? "incomplete" : "pending";
    sum[status] += 1;
    return sum;
  }, { completed: 0, incomplete: 0, pending: 0 }) ?? { completed: 0, incomplete: 0, pending: 0 }, [data]);

  if (loading) {
    return <div className="flex min-h-[75vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-24">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">TaskGram workspace</p>
          <h1 className="mt-1 text-2xl font-bold">Hello, {data?.profile.full_name?.split(" ")[0] || "there"}</h1>
          <p className="text-sm text-muted-foreground">Manage your day without leaving Telegram.</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => void refresh()} aria-label="Refresh"><RefreshCw className="h-4 w-4" /></Button>
      </header>

      {error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <nav className="grid grid-cols-4 gap-1 rounded-lg border bg-muted p-1">
        {([
          ["tasks", ListTodo, "Tasks"],
          ["notes", NotebookPen, "Notes"],
          ["money", CircleDollarSign, "Money"],
          ["records", BarChart3, "Records"]
        ] as const).map(([value, Icon, label]) => (
          <button key={value} onClick={() => setTab(value)} className={cn("flex h-11 items-center justify-center gap-2 rounded-md text-sm font-medium", tab === value ? "bg-background text-primary shadow-sm" : "text-muted-foreground")}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </nav>

      {tab === "tasks" && (
        <section className="space-y-3">
          <Button className="w-full" onClick={() => setShowTaskForm(!showTaskForm)}><Plus className="h-4 w-4" />{showTaskForm ? "Close task form" : "Add task"}</Button>
          {showTaskForm && (
            <Card><CardContent className="p-4"><form onSubmit={submitTask} className="space-y-3">
              <Field label="Task title"><Input name="title" required autoFocus placeholder="What needs to be done?" /></Field>
              <Field label="Details"><Textarea name="description" placeholder="Optional details" className="min-h-16" /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Date"><Input name="date" type="date" defaultValue={defaults.date} required /></Field>
                <Field label="Time"><Input name="time" type="time" defaultValue={defaults.time} required /></Field>
                <Field label="Priority"><Select name="priority" defaultValue="medium"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></Select></Field>
                <Field label="Category"><Select name="category" defaultValue="personal"><option value="personal">Personal</option><option value="study">Study</option><option value="work">Work</option><option value="health">Health</option><option value="finance">Finance</option></Select></Field>
                <Field label="Remind"><Select name="reminderMinutesBefore" defaultValue="0"><option value="0">At due time</option><option value="10">10 min before</option><option value="30">30 min before</option><option value="60">1 hour before</option></Select></Field>
                <Field label="Repeat"><Select name="recurrenceType" defaultValue="none"><option value="none">Never</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></Select></Field>
              </div>
              <Button className="w-full" disabled={busy === "new-task"}>{busy === "new-task" && <Loader2 className="h-4 w-4 animate-spin" />}Save task</Button>
            </form></CardContent></Card>
          )}
          {data?.tasks.length ? data.tasks.map((task) => (
            <Card key={task.id}><CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="font-semibold">{task.title}</h2><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3 w-3" />{new Date(task.due_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p></div>
                <span className={cn("rounded-full px-2 py-1 text-xs font-medium", task.priority === "high" ? "bg-red-500/15 text-red-600" : task.priority === "low" ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600")}>{task.priority}</span>
              </div>
              {task.description && <p className="line-clamp-2 text-sm text-muted-foreground">{task.description}</p>}
              <div className="grid grid-cols-3 gap-2">
                <ActionButton label="Complete" icon={Check} onClick={() => mutate(task.id, { resource: "task", id: task.id, action: "complete" })} disabled={busy === task.id} />
                <ActionButton label="Incomplete" icon={CircleX} destructive onClick={() => mutate(task.id, { resource: "task", id: task.id, action: "incomplete" })} disabled={busy === task.id} />
                <ActionButton label="Snooze" icon={Clock3} onClick={() => mutate(task.id, { resource: "task", id: task.id, action: "snooze", minutes: 10 })} disabled={busy === task.id} />
                <ActionButton label="Archive" icon={Archive} onClick={() => mutate(task.id, { resource: "task", id: task.id, action: "archive" })} disabled={busy === task.id} />
                <ActionButton label="Delete" icon={Trash2} destructive onClick={() => confirm("Delete this task?") && mutate(task.id, { resource: "task", id: task.id, action: "delete" })} disabled={busy === task.id} />
              </div>
            </CardContent></Card>
          )) : <Empty>No active tasks. Add one when inspiration strikes.</Empty>}
        </section>
      )}

      {tab === "notes" && (
        <section className="space-y-3">
          <Card><CardContent className="p-4"><form onSubmit={submitNote} className="space-y-3">
            <Field label="New note"><Input name="title" required placeholder="Note title" /></Field>
            <Textarea name="content" placeholder="Write anything you want to remember..." className="min-h-20" />
            <input type="hidden" name="color" value="default" />
            <Button className="w-full" disabled={busy === "new-note"}><Plus className="h-4 w-4" />Save note</Button>
          </form></CardContent></Card>
          {data?.notes.length ? data.notes.map((note) => (
            <Card key={note.id}><CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2"><h2 className="font-semibold">{note.title}</h2>{note.is_pinned && <Pin className="h-4 w-4 text-primary" />}</div>
              {note.content && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{note.content}</p>}
              <div className="grid grid-cols-3 gap-2">
                <ActionButton label={note.is_pinned ? "Unpin" : "Pin"} icon={Pin} onClick={() => mutate(note.id, { resource: "note", id: note.id, action: "pin", value: !note.is_pinned })} disabled={busy === note.id} />
                <ActionButton label="Archive" icon={Archive} onClick={() => mutate(note.id, { resource: "note", id: note.id, action: "archive", value: true })} disabled={busy === note.id} />
                <ActionButton label="Delete" icon={Trash2} destructive onClick={() => confirm("Delete this note?") && mutate(note.id, { resource: "note", id: note.id, action: "delete" })} disabled={busy === note.id} />
              </div>
            </CardContent></Card>
          )) : <Empty>Your notes will appear here.</Empty>}
        </section>
      )}

      {tab === "money" && (
        <section className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Summary label="Income" value={totals.income} icon={TrendingUp} color="text-emerald-600" />
            <Summary label="Expenses" value={totals.expense} icon={TrendingDown} color="text-red-600" />
          </div>
          <Card><CardContent className="p-4"><form onSubmit={submitTransaction} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Type"><Select name="transactionType" defaultValue="expense"><option value="expense">Expense</option><option value="income">Income</option></Select></Field>
              <Field label="Amount"><Input name="amount" type="number" min="0.01" step="0.01" required placeholder="0.00" /></Field>
              <Field label="Category"><Input name="category" required placeholder="Food, salary..." /></Field>
              <Field label="Date"><Input name="transactionDate" type="date" defaultValue={today()} required /></Field>
            </div>
            <Input name="description" placeholder="Optional description" />
            <input type="hidden" name="currency" value="BDT" />
            <Button className="w-full" disabled={busy === "new-transaction"}><Plus className="h-4 w-4" />Add transaction</Button>
          </form></CardContent></Card>
          {data?.transactions.length ? data.transactions.map((item) => (
            <Card key={item.id}><CardContent className="flex items-center gap-3 p-4">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", item.transaction_type === "income" ? "bg-emerald-500/15 text-emerald-600" : "bg-red-500/15 text-red-600")}>
                {item.transaction_type === "income" ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1"><p className="truncate font-medium">{item.category}</p><p className="text-xs text-muted-foreground">{item.transaction_date}{item.description ? ` · ${item.description}` : ""}</p></div>
              <p className={cn("text-sm font-bold", item.transaction_type === "income" ? "text-emerald-600" : "text-red-600")}>{item.transaction_type === "income" ? "+" : "-"}{Number(item.amount).toLocaleString()} {item.currency}</p>
              <Button variant="ghost" size="icon" aria-label="Delete transaction" onClick={() => confirm("Delete this transaction?") && mutate(item.id, { resource: "finance", id: item.id, action: "delete" })}><Trash2 className="h-4 w-4" /></Button>
            </CardContent></Card>
          )) : <Empty>This month has no transactions yet.</Empty>}
        </section>
      )}

      {tab === "records" && (
        <section className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <MiniRecordStat label="Done" value={recordTotals.completed} color="text-emerald-600" />
            <MiniRecordStat label="Incomplete" value={recordTotals.incomplete} color="text-red-600" />
            <MiniRecordStat label="Pending" value={recordTotals.pending} color="text-sky-600" />
          </div>
          <p className="text-xs font-medium uppercase text-muted-foreground">This month</p>
          {data?.records.filter((record) => record.status !== "cancelled").length ? data.records.filter((record) => record.status !== "cancelled").map((record) => {
            const status = record.status === "completed" ? "completed" : record.status === "incomplete" || new Date(record.due_at).getTime() < new Date(data.generatedAt).getTime() ? "incomplete" : "pending";
            return (
              <Card key={record.id}><CardContent className="flex items-center gap-3 p-4">
                <div className={cn("h-2.5 w-2.5 shrink-0 rounded-full", status === "completed" ? "bg-emerald-500" : status === "incomplete" ? "bg-red-500" : "bg-sky-500")} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{record.title}</p>
                  <p className="text-xs text-muted-foreground">Due {new Date(record.due_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>
                  {status === "completed" && record.completed_at && <p className="mt-1 text-xs font-medium text-emerald-600">Completed {new Date(record.completed_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>}
                </div>
                <span className="text-xs font-medium capitalize text-muted-foreground">{status}</span>
              </CardContent></Card>
            );
          }) : <Empty>No task records this month.</Empty>}
        </section>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className="h-10 w-full rounded-md border bg-background px-3 text-sm" />;
}

function ActionButton({ label, icon: Icon, destructive, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; icon: typeof Check; destructive?: boolean }) {
  return <button {...props} className={cn("flex h-14 flex-col items-center justify-center gap-1 rounded-md border text-[11px] font-medium disabled:opacity-50", destructive ? "text-destructive" : "text-muted-foreground")}><Icon className="h-4 w-4" />{label}</button>;
}

function Summary({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof CircleDollarSign; color: string }) {
  return <Card><CardContent className="p-4"><Icon className={cn("h-5 w-5", color)} /><p className="mt-3 text-xs text-muted-foreground">{label} this month</p><p className={cn("mt-1 text-lg font-bold", color)}>{value.toLocaleString()} BDT</p></CardContent></Card>;
}

function MiniRecordStat({ label, value, color }: { label: string; value: number; color: string }) {
  return <Card><CardContent className="p-3 text-center"><p className={cn("text-xl font-bold", color)}>{value}</p><p className="mt-1 text-[10px] text-muted-foreground">{label}</p></CardContent></Card>;
}
