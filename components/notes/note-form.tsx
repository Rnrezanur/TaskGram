"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Note } from "@/lib/types";

type State = { error?: string; success?: string };

export function NoteForm({
  action,
  initial,
  compact = false
}: {
  action: (state: State | void, formData: FormData) => Promise<State | void>;
  initial?: Note;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" placeholder="Note title" defaultValue={initial?.title ?? ""} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Note</Label>
        <Textarea id="content" name="content" placeholder="Write anything you want to remember..." defaultValue={initial?.content ?? ""} className={compact ? "min-h-28" : "min-h-64"} />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <select id="color" name="color" defaultValue={initial?.color ?? "default"} className="h-10 rounded-md border bg-background px-3 text-sm">
            <option value="default">Default</option>
            <option value="blue">Blue</option>
            <option value="green">Green</option>
            <option value="amber">Amber</option>
            <option value="rose">Rose</option>
          </select>
        </div>
        <Button disabled={pending}><Save className="h-4 w-4" />{pending ? "Saving..." : initial ? "Update note" : "Save note"}</Button>
      </div>
      {state?.error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">{state.success}</p>}
    </form>
  );
}
