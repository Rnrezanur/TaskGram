import Link from "next/link";
import { addDays, addMonths, format } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { AlertCircle, ArrowLeft, ArrowRight, BarChart3, CheckCircle2, Clock3 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { taskRecordStatus, taskRecordSummary, type DisplayTaskStatus } from "@/lib/reminders/records";
import { createClient } from "@/lib/supabase/server";

type RecordRow = {
  id: string;
  reminder_id: string;
  due_at: string;
  status: "pending" | "completed" | "incomplete" | "cancelled";
  completed_at: string | null;
  reminders: {
    title: string;
    priority: string;
    category: string;
    timezone: string;
    recurrence_type: string;
  } | null;
};

type RecordView = "day" | "month" | "range";

function rangeFor(view: RecordView, selected: string, timezone: string, from: string, to: string) {
  if (view === "range") {
    return {
      start: fromZonedTime(`${from}T00:00:00`, timezone),
      end: addDays(fromZonedTime(`${to}T00:00:00`, timezone), 1)
    };
  }
  if (view === "day") {
    const start = fromZonedTime(`${selected}T00:00:00`, timezone);
    return { start, end: addDays(start, 1) };
  }
  const start = fromZonedTime(`${selected}-01T00:00:00`, timezone);
  return { start, end: addMonths(start, 1) };
}

function moveSelection(view: Exclude<RecordView, "range">, selected: string, amount: number) {
  const parsed = new Date(`${view === "day" ? selected : `${selected}-01`}T12:00:00`);
  return format(view === "day" ? addDays(parsed, amount) : addMonths(parsed, amount), view === "day" ? "yyyy-MM-dd" : "yyyy-MM");
}

function statusStyle(status: Exclude<DisplayTaskStatus, "cancelled">) {
  if (status === "completed") return "border-emerald-300 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (status === "incomplete") return "border-red-300 bg-red-500/10 text-red-700 dark:text-red-300";
  return "border-sky-300 bg-sky-500/10 text-sky-700 dark:text-sky-300";
}

export default async function RecordsPage({ searchParams }: { searchParams: Promise<{ view?: string; date?: string; from?: string; to?: string }> }) {
  const params = await searchParams;
  const view: RecordView = params.view === "day" || params.view === "range" ? params.view : "month";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user!.id).single();
  const timezone = profile?.timezone ?? "Asia/Dhaka";
  const todayDate = formatInTimeZone(new Date(), timezone, "yyyy-MM-dd");
  const fallbackDate = view === "day" ? todayDate : formatInTimeZone(new Date(), timezone, "yyyy-MM");
  const selected = params.date?.match(view === "day" ? /^\d{4}-\d{2}-\d{2}$/ : /^\d{4}-\d{2}$/)?.[0] ?? fallbackDate;
  const rawFrom = params.from?.match(/^\d{4}-\d{2}-\d{2}$/)?.[0] ?? todayDate;
  const rawTo = params.to?.match(/^\d{4}-\d{2}-\d{2}$/)?.[0] ?? rawFrom;
  const [from, to] = rawFrom <= rawTo ? [rawFrom, rawTo] : [rawTo, rawFrom];
  const { start, end } = rangeFor(view, selected, timezone, from, to);

  const { data } = await supabase
    .from("task_occurrences")
    .select("id,reminder_id,due_at,status,completed_at,reminders(title,priority,category,timezone,recurrence_type)")
    .eq("user_id", user!.id)
    .gte("due_at", start.toISOString())
    .lt("due_at", end.toISOString())
    .order("due_at", { ascending: false });

  const records = (data ?? []) as unknown as RecordRow[];
  const now = new Date().getTime();
  const visible = records.filter((record) => taskRecordStatus(record, now) !== "cancelled");
  const totals = taskRecordSummary(records, now);
  const decided = totals.completed + totals.incomplete;
  const completionRate = decided ? Math.round((totals.completed / decided) * 100) : 0;
  const groups = Object.groupBy(visible, (record) => formatInTimeZone(record.due_at, timezone, "yyyy-MM-dd"));
  const title = view === "day"
    ? formatInTimeZone(start, timezone, "EEEE, d MMMM yyyy")
    : view === "month"
      ? formatInTimeZone(start, timezone, "MMMM yyyy")
      : from === to
        ? formatInTimeZone(start, timezone, "d MMMM yyyy")
        : `${formatInTimeZone(start, timezone, "d MMM yyyy")} to ${formatInTimeZone(addDays(end, -1), timezone, "d MMM yyyy")}`;

  return (
    <div className="space-y-5">
      <header className="rounded-lg border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Task records</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Your progress, clearly recorded</h1>
            <p className="mt-1 text-sm text-muted-foreground">Review completed, incomplete, and pending work by day or month.</p>
          </div>
          <Button asChild><Link href="/dashboard/reminders/new">Add task</Link></Button>
        </div>
      </header>

      <section className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="grid grid-cols-3 gap-1 rounded-md bg-muted p-1">
          <Link href={`/dashboard/records?view=day&date=${formatInTimeZone(new Date(), timezone, "yyyy-MM-dd")}`} className={`rounded px-4 py-2 text-center text-sm font-medium ${view === "day" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}>Daily</Link>
          <Link href={`/dashboard/records?view=month&date=${formatInTimeZone(new Date(), timezone, "yyyy-MM")}`} className={`rounded px-4 py-2 text-center text-sm font-medium ${view === "month" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}>Monthly</Link>
          <Link href={`/dashboard/records?view=range&from=${todayDate}&to=${todayDate}`} className={`rounded px-3 py-2 text-center text-sm font-medium ${view === "range" ? "bg-background text-primary shadow-sm" : "text-muted-foreground"}`}>Custom</Link>
        </div>
        <div className={`grid items-center gap-2 ${view === "range" ? "grid-cols-1" : "grid-cols-[40px_1fr_40px]"}`}>
          {view !== "range" && <Button asChild variant="outline" size="icon"><Link aria-label="Previous period" href={`/dashboard/records?view=${view}&date=${moveSelection(view, selected, -1)}`}><ArrowLeft className="h-4 w-4" /></Link></Button>}
          <p className="min-w-0 text-center text-sm font-semibold">{title}</p>
          {view !== "range" && <Button asChild variant="outline" size="icon"><Link aria-label="Next period" href={`/dashboard/records?view=${view}&date=${moveSelection(view, selected, 1)}`}><ArrowRight className="h-4 w-4" /></Link></Button>}
        </div>
      </section>

      <form className="grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <input type="hidden" name="view" value="range" />
        <label className="space-y-2 text-sm font-medium">From date<Input type="date" name="from" defaultValue={from} required /></label>
        <label className="space-y-2 text-sm font-medium">To date<Input type="date" name="to" defaultValue={to} required /></label>
        <Button>Filter records</Button>
        <Button asChild variant="outline"><Link href="/dashboard/records">Clear</Link></Button>
      </form>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <RecordStat label="Completion rate" value={`${completionRate}%`} icon={BarChart3} color="text-primary" />
        <RecordStat label="Completed" value={totals.completed} icon={CheckCircle2} color="text-emerald-600" />
        <RecordStat label="Incomplete" value={totals.incomplete} icon={AlertCircle} color="text-red-600" />
        <RecordStat label="Pending" value={totals.pending} icon={Clock3} color="text-sky-600" />
      </section>

      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Completion progress</span>
            <span className="text-muted-foreground">{totals.completed} of {decided} decided tasks</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${completionRate}%` }} /></div>
        </CardContent>
      </Card>

      {visible.length ? (
        <section className="space-y-5">
          {Object.entries(groups).map(([day, dayRecords]) => (
            <div key={day} className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">{formatInTimeZone(`${day}T12:00:00Z`, "UTC", "EEEE, d MMMM")}</h2>
                <span className="text-xs text-muted-foreground">{dayRecords?.length ?? 0} tasks</span>
              </div>
              <div className="space-y-2">
                {dayRecords?.map((record) => {
                  const status = taskRecordStatus(record, now) as Exclude<DisplayTaskStatus, "cancelled">;
                  return (
                    <Link key={record.id} href={`/dashboard/reminders/${record.reminder_id}`} className="flex flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{record.reminders?.title ?? "Deleted task"}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatInTimeZone(record.due_at, timezone, "h:mm a")} / {record.reminders?.category ?? "task"}
                          {record.reminders?.recurrence_type !== "none" ? " / recurring" : ""}
                        </p>
                      </div>
                      <Badge className={statusStyle(status)}>{status}</Badge>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ) : <EmptyState title="No task records in this period" text="Tasks scheduled for this day or month will appear here." />}
    </div>
  );
}

function RecordStat({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: typeof BarChart3; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <Icon className={`h-5 w-5 ${color}`} />
        <p className="mt-3 text-xs text-muted-foreground sm:text-sm">{label}</p>
        <p className="mt-1 text-2xl font-bold sm:text-3xl">{value}</p>
      </CardContent>
    </Card>
  );
}
