"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Archive, Check, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { archiveReminderAction, completeReminderAction, deleteReminderAction } from "@/lib/actions/reminders";

export function ReminderActions({ reminderId }: { reminderId: string }) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<"complete" | "archive" | "delete" | null>(null);
  const [, startTransition] = useTransition();

  function runAction(actionName: "complete" | "archive" | "delete", action: () => Promise<void>) {
    setPendingAction(actionName);
    startTransition(async () => {
      try {
        await action();
        toast.success(actionName === "complete" ? "Reminder completed." : actionName === "archive" ? "Reminder archived." : "Reminder deleted.");
        if (actionName === "delete") {
          router.push("/dashboard/reminders");
        } else {
          router.refresh();
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not update reminder.");
      } finally {
        setPendingAction(null);
      }
    });
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="secondary"
        disabled={pendingAction !== null}
        onClick={() => runAction("complete", () => completeReminderAction(reminderId))}
      >
        <Check className="h-4 w-4" />
        {pendingAction === "complete" ? "Completing..." : "Complete"}
      </Button>
      <Button asChild size="sm" variant="outline">
        <Link href={`/dashboard/reminders/${reminderId}/edit`}>
          <Pencil className="h-4 w-4" />
          Edit
        </Link>
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pendingAction !== null}
        onClick={() => runAction("archive", () => archiveReminderAction(reminderId))}
      >
        <Archive className="h-4 w-4" />
        {pendingAction === "archive" ? "Archiving..." : "Archive"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={pendingAction !== null}
        onClick={() => runAction("delete", () => deleteReminderAction(reminderId))}
      >
        <Trash2 className="h-4 w-4" />
        {pendingAction === "delete" ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}
