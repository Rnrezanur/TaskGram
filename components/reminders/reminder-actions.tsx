"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Archive, Check, CircleX, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { archiveReminderAction, completeReminderAction, deleteReminderAction, markReminderIncompleteAction } from "@/lib/actions/reminders";
import type { ReminderStatus } from "@/lib/types";

export function ReminderActions({ reminderId, status }: { reminderId: string; status: ReminderStatus }) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<"complete" | "incomplete" | "archive" | "delete" | null>(null);
  const [localStatus, setLocalStatus] = useState(status);
  const [, startTransition] = useTransition();

  function runAction(actionName: "complete" | "incomplete" | "archive" | "delete", action: () => Promise<void>) {
    const previousStatus = localStatus;
    setPendingAction(actionName);
    if (actionName === "complete") setLocalStatus("completed");
    if (actionName === "archive") setLocalStatus("archived");
    startTransition(async () => {
      try {
        await action();
        toast.success(actionName === "complete" ? "Reminder completed." : actionName === "incomplete" ? "Task marked incomplete." : actionName === "archive" ? "Reminder archived." : "Reminder deleted.");
        if (actionName === "delete") {
          router.push("/dashboard/reminders");
        } else {
          router.refresh();
        }
      } catch (error) {
        setLocalStatus(previousStatus);
        toast.error(error instanceof Error ? error.message : "Could not update reminder.");
      } finally {
        setPendingAction(null);
      }
    });
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      {localStatus === "completed" ? (
        <Button size="sm" variant="secondary" disabled className="w-full sm:w-auto">
          <Check className="h-4 w-4" />
          Completed
        </Button>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          className="w-full sm:w-auto"
          disabled={pendingAction !== null || localStatus !== "active"}
          onClick={() => runAction("complete", () => completeReminderAction(reminderId))}
        >
          <Check className="h-4 w-4" />
          {pendingAction === "complete" ? "Completing..." : "Complete"}
        </Button>
      )}
      {localStatus === "active" && (
        <Button
          size="sm"
          variant="outline"
          className="w-full border-red-300 text-red-700 hover:bg-red-500/10 sm:w-auto dark:text-red-300"
          disabled={pendingAction !== null}
          onClick={() => runAction("incomplete", () => markReminderIncompleteAction(reminderId))}
        >
          <CircleX className="h-4 w-4" />
          {pendingAction === "incomplete" ? "Saving..." : "Incomplete"}
        </Button>
      )}
      <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
        <Link href={`/dashboard/reminders/${reminderId}/edit`}>
          <Pencil className="h-4 w-4" />
          Edit
        </Link>
      </Button>
      {localStatus !== "archived" && (
        <Button
          size="sm"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={pendingAction !== null}
          onClick={() => runAction("archive", () => archiveReminderAction(reminderId))}
        >
          <Archive className="h-4 w-4" />
          {pendingAction === "archive" ? "Archiving..." : "Archive"}
        </Button>
      )}
      <Button
        size="sm"
        variant="destructive"
        className="w-full sm:w-auto"
        disabled={pendingAction !== null}
        onClick={() => runAction("delete", () => deleteReminderAction(reminderId))}
      >
        <Trash2 className="h-4 w-4" />
        {pendingAction === "delete" ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}
