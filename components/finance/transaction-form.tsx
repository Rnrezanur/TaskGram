"use client";

import { useActionState, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTransactionAction } from "@/lib/actions/finance";
import { cn } from "@/lib/utils";

type State = { error?: string; success?: string };

const categories = {
  expense: ["Food", "Transport", "Housing", "Bills", "Shopping", "Health", "Education", "Entertainment", "Other"],
  income: ["Salary", "Freelance", "Business", "Gift", "Investment", "Other"]
};

export function TransactionForm() {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [state, formAction, pending] = useActionState<State | void, FormData>(createTransactionAction, {});
  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setType("expense")} className={cn("flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-medium", type === "expense" ? "border-red-400 bg-red-500/10 text-red-600 dark:text-red-300" : "text-muted-foreground")}><ArrowUpRight className="h-4 w-4" />Expense</button>
        <button type="button" onClick={() => setType("income")} className={cn("flex h-10 items-center justify-center gap-2 rounded-md border text-sm font-medium", type === "income" ? "border-emerald-400 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "text-muted-foreground")}><ArrowDownLeft className="h-4 w-4" />Income</button>
      </div>
      <input type="hidden" name="transactionType" value={type} />
      <input type="hidden" name="currency" value="BDT" />
      <div className="space-y-2"><Label htmlFor="amount">Amount</Label><div className="relative"><span className="absolute left-3 top-2.5 text-sm text-muted-foreground">৳</span><Input id="amount" name="amount" type="number" min="0.01" step="0.01" placeholder="0.00" className="pl-8 text-lg font-semibold" required /></div></div>
      <div className="space-y-2"><Label htmlFor="category">Category</Label><select id="category" name="category" className="h-10 w-full rounded-md border bg-background px-3 text-sm">{categories[type].map((category) => <option key={category}>{category}</option>)}</select></div>
      <div className="space-y-2"><Label htmlFor="transactionDate">Date</Label><Input id="transactionDate" name="transactionDate" type="date" defaultValue={today} required /></div>
      <div className="space-y-2"><Label htmlFor="description">Description</Label><Input id="description" name="description" placeholder="Optional note" /></div>
      {state?.error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">{state.success}</p>}
      <Button className="w-full" disabled={pending}><Plus className="h-4 w-4" />{pending ? "Adding..." : `Add ${type}`}</Button>
    </form>
  );
}
