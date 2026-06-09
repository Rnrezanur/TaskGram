"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { transactionSchema } from "@/lib/validations/workspace";

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createTransactionAction(_: unknown, formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = transactionSchema.safeParse({
    transactionType: formData.get("transactionType"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    description: formData.get("description") || "",
    transactionDate: formData.get("transactionDate"),
    currency: formData.get("currency") || "BDT"
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid transaction." };

  const { error } = await supabase.from("finance_transactions").insert({
    user_id: user.id,
    transaction_type: parsed.data.transactionType,
    amount: parsed.data.amount,
    category: parsed.data.category,
    description: parsed.data.description || null,
    transaction_date: parsed.data.transactionDate,
    currency: parsed.data.currency.toUpperCase()
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/finance");
  return { success: "Transaction added." };
}

export async function deleteTransactionAction(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("finance_transactions").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard/finance");
}
