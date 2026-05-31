import Link from "next/link";
import { Archive, Check, Clock, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryBadge, PriorityBadge } from "@/components/reminders/badges";
import { archiveReminderAction, completeReminderAction, deleteReminderAction } from "@/lib/actions/reminders";
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
        <div className="mt-4 flex flex-wrap gap-2">
          <form action={completeReminderAction.bind(null, reminder.id)}><Button size="sm" variant="secondary"><Check className="h-4 w-4" />Complete</Button></form>
          <Button asChild size="sm" variant="outline"><Link href={`/dashboard/reminders/${reminder.id}/edit`}><Pencil className="h-4 w-4" />Edit</Link></Button>
          <form action={archiveReminderAction.bind(null, reminder.id)}><Button size="sm" variant="outline"><Archive className="h-4 w-4" />Archive</Button></form>
          <form action={deleteReminderAction.bind(null, reminder.id)}><Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" />Delete</Button></form>
        </div>
      </CardContent>
    </Card>
  );
}
