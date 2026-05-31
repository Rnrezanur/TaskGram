"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";

type State = { error?: string; success?: string };

export function ActionForm({
  action,
  children,
  submitLabel,
  className
}: {
  action: (state: State | void, formData: FormData) => Promise<State | void>;
  children: React.ReactNode;
  submitLabel: string;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={className ?? "space-y-4"}>
      {children}
      {state?.error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">{state.success}</p>}
      <Button className="w-full" disabled={pending}>{pending ? "Working..." : submitLabel}</Button>
    </form>
  );
}
