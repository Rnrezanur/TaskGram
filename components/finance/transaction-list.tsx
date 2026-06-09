import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteTransactionAction } from "@/lib/actions/finance";
import { cn } from "@/lib/utils";
import type { FinanceTransaction } from "@/lib/types";

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-BD", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

export function TransactionList({ transactions }: { transactions: FinanceTransaction[] }) {
  return (
    <div className="divide-y">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center gap-3 py-3">
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm font-bold", transaction.transaction_type === "income" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600")}>{transaction.transaction_type === "income" ? "+" : "-"}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{transaction.category}</p><p className="truncate text-xs text-muted-foreground">{transaction.description || new Date(`${transaction.transaction_date}T00:00:00`).toLocaleDateString()}</p></div>
          <div className="text-right"><p className={cn("text-sm font-semibold", transaction.transaction_type === "income" ? "text-emerald-600" : "text-red-600")}>{transaction.transaction_type === "income" ? "+" : "-"}{money(Number(transaction.amount), transaction.currency)}</p><p className="text-xs text-muted-foreground">{transaction.transaction_date}</p></div>
          <form action={deleteTransactionAction.bind(null, transaction.id)}><Button size="icon" variant="ghost" title="Delete transaction"><Trash2 className="h-4 w-4" /></Button></form>
        </div>
      ))}
    </div>
  );
}
