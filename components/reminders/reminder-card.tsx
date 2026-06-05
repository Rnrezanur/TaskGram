import Link from "next/link";
import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryBadge, PriorityBadge } from "@/components/reminders/badges";
import { ReminderActions } from "@/components/reminders/reminder-actions";
import { shortDate } from "@/lib/time";
import type { Reminder } from "@/lib/types";

export function ReminderCard({ reminder }: { reminder: Reminder }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href={`/dashboard/reminders/${reminder.id}`} className="font-semibold hover:text-primary">{reminder.title}</Link>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" />{shortDate(reminder.due_at, reminder.timezone)}</p>
          </div>
          <div className="flex gap-2"><PriorityBadge priority={reminder.priority} /><CategoryBadge category={reminder.category} /></div>
        </div>
        {reminder.description && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{reminder.description}</p>}
        <ReminderActions reminderId={reminder.id} />
      </CardContent>
    </Card>
  );
}
