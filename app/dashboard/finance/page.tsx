import Link from "next/link";
import { ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, Landmark, WalletCards } from "lucide-react";
import { TransactionForm } from "@/components/finance/transaction-form";
import { TransactionList } from "@/components/finance/transaction-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { createClient } from "@/lib/supabase/server";
import type { FinanceTransaction } from "@/lib/types";

function monthRange(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const start = `${year}-${String(monthNumber).padStart(2, "0")}-01`;
  const endDate = new Date(Date.UTC(year, monthNumber, 1));
  const end = endDate.toISOString().slice(0, 10);
  return { start, end };
}

function shiftMonth(month: string, delta: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 1 + delta, 1)).toISOString().slice(0, 7);
}

function money(value: number) {
  return new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 2 }).format(value);
}

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams;
  const currentMonth = params.month && /^\d{4}-\d{2}$/.test(params.month) ? params.month : new Date().toISOString().slice(0, 7);
  const { start, end } = monthRange(currentMonth);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [monthResult, allResult] = await Promise.all([
    supabase.from("finance_transactions").select("*").eq("user_id", user!.id).gte("transaction_date", start).lt("transaction_date", end).order("transaction_date", { ascending: false }).order("created_at", { ascending: false }).limit(500).returns<FinanceTransaction[]>(),
    supabase.from("finance_transactions").select("transaction_type,amount").eq("user_id", user!.id).limit(5000)
  ]);
  const transactions = monthResult.data ?? [];
  const allTransactions = allResult.data ?? [];
  const income = transactions.filter((item) => item.transaction_type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
  const expense = transactions.filter((item) => item.transaction_type === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
  const balance = allTransactions.reduce((sum, item) => sum + (item.transaction_type === "income" ? Number(item.amount) : -Number(item.amount)), 0);
  const categoryTotals = transactions.filter((item) => item.transaction_type === "expense").reduce<Record<string, number>>((totals, item) => ({ ...totals, [item.category]: (totals[item.category] ?? 0) + Number(item.amount) }), {});
  const topCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const monthLabel = new Date(`${currentMonth}-01T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-3xl font-bold">Finance</h1><p className="text-muted-foreground">Track income, daily expenses, monthly spending, and your running balance.</p></div>
          <div className="flex items-center gap-2"><Link href={`/dashboard/finance?month=${shiftMonth(currentMonth, -1)}`} className="rounded-md border p-2"><ArrowLeft className="h-4 w-4" /></Link><span className="min-w-36 text-center text-sm font-semibold">{monthLabel}</span><Link href={`/dashboard/finance?month=${shiftMonth(currentMonth, 1)}`} className="rounded-md border p-2"><ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total balance" value={money(balance)} icon={WalletCards} />
        <StatCard label="Monthly income" value={money(income)} icon={ArrowDownLeft} />
        <StatCard label="Monthly expense" value={money(expense)} icon={ArrowUpRight} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <Card className="h-fit xl:sticky xl:top-6"><CardHeader><CardTitle>Add transaction</CardTitle></CardHeader><CardContent><TransactionForm /></CardContent></Card>
        <div className="space-y-6">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5 text-primary" />Transactions</CardTitle></CardHeader><CardContent>{transactions.length ? <TransactionList transactions={transactions} /> : <p className="py-8 text-center text-sm text-muted-foreground">No transactions for {monthLabel}.</p>}</CardContent></Card>
          <Card><CardHeader><CardTitle>Top expense categories</CardTitle></CardHeader><CardContent className="space-y-3">{topCategories.length ? topCategories.map(([category, total]) => <div key={category} className="flex items-center justify-between rounded-md border p-3 text-sm"><span className="font-medium">{category}</span><span className="text-red-600">{money(total)}</span></div>) : <p className="text-sm text-muted-foreground">Add expenses to see your spending breakdown.</p>}</CardContent></Card>
        </div>
      </div>
    </div>
  );
}
