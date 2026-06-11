import Link from "next/link";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryBadge, PriorityBadge } from "@/components/reminders/badges";
import { ReminderActions } from "@/components/reminders/reminder-actions";
import { shortDate } from "@/lib/time";
import type { Reminder } from "@/lib/types";

export function ReminderCard({ reminder }: { reminder: Reminder }) {
  const isCompleted = reminder.status === "completed";
  const isArchived = reminder.status === "archived";
  const isCancelled = reminder.status === "cancelled";
  const isIncomplete = reminder.status === "active" && new Date(reminder.due_at).getTime() < new Date().getTime();
  return (
    <Card className={isCompleted || isArchived || isCancelled ? "opacity-75" : undefined}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <Link href={`/dashboard/reminders/${reminder.id}`} className="font-semibold hover:text-primary">{reminder.title}</Link>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" />{shortDate(reminder.due_at, reminder.timezone)}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {isCompleted && <Badge className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950">completed</Badge>}
            {isArchived && <Badge className="bg-muted text-muted-foreground">archived</Badge>}
            {isCancelled && <Badge className="border-red-300 bg-red-500/10 text-red-700 dark:text-red-300">incomplete</Badge>}
            {isIncomplete && <Badge className="border-red-300 bg-red-500/10 text-red-700 dark:text-red-300">incomplete</Badge>}
            {!isCompleted && !isArchived && !isCancelled && !isIncomplete && <Badge className="border-sky-300 bg-sky-500/10 text-sky-700 dark:text-sky-300">pending</Badge>}
            <PriorityBadge priority={reminder.priority} />
            <CategoryBadge category={reminder.category} />
          </div>
        </div>
        {reminder.description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{reminder.description}</p>}
        <ReminderActions reminderId={reminder.id} status={reminder.status} />
      </CardContent>
    </Card>
  );
}
