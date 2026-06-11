import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildSnoozeDelivery, nextRecurringDelivery } from "@/lib/reminders/schedule";
import { getMiniAppContext } from "@/lib/telegram/mini-app";
import type { Reminder } from "@/lib/types";
import { noteSchema, transactionSchema } from "@/lib/validations/workspace";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

const mutationSchema = z.union([
  z.object({
    resource: z.literal("task"),
    id: z.string().uuid(),
    action: z.enum(["complete", "incomplete", "snooze", "archive", "delete"]),
    minutes: z.coerce.number().int().min(1).max(10080).optional()
  }),
  z.object({
    resource: z.literal("note"),
    action: z.literal("create"),
    title: z.string(),
    content: z.string().optional().default(""),
    color: z.string().optional().default("default")
  }),
  z.object({
    resource: z.literal("note"),
    id: z.string().uuid(),
    action: z.enum(["pin", "archive", "delete"]),
    value: z.boolean().optional()
  }),
  z.object({
    resource: z.literal("finance"),
    action: z.literal("create"),
    transactionType: z.enum(["income", "expense"]),
    amount: z.coerce.number(),
    category: z.string(),
    description: z.string().optional().default(""),
    transactionDate: z.string(),
    currency: z.string().optional().default("BDT")
  }),
  z.object({
    resource: z.literal("finance"),
    id: z.string().uuid(),
    action: z.literal("delete")
  })
]);

function responseError(error: unknown, status = 500) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "TaskGram could not complete that action." },
    { status }
  );
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, userId } = await getMiniAppContext(request.headers.get("x-telegram-init-data"));
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthDate = monthStart.toISOString().slice(0, 10);

    const [profileResult, tasksResult, notesResult, financeResult, recordsResult] = await Promise.all([
      supabase.from("profiles").select("full_name,timezone").eq("id", userId).single(),
      supabase
        .from("reminders")
        .select("id,title,description,due_at,timezone,priority,category,recurrence_type,status")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("due_at", { ascending: true })
        .limit(30),
      supabase
        .from("notes")
        .select("id,title,content,color,is_pinned,is_archived,updated_at")
        .eq("user_id", userId)
        .eq("is_archived", false)
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false })
        .limit(30),
      supabase
        .from("finance_transactions")
        .select("id,transaction_type,amount,category,description,transaction_date,currency")
        .eq("user_id", userId)
        .gte("transaction_date", monthDate)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("task_occurrences")
        .select("id,reminder_id,due_at,status,completed_at,title,category")
        .eq("user_id", userId)
        .gte("due_at", monthStart.toISOString())
        .order("due_at", { ascending: false })
        .limit(60)
    ]);

    const firstError = profileResult.error || tasksResult.error || notesResult.error || financeResult.error || recordsResult.error;
    if (firstError) throw firstError;

    return NextResponse.json({
      profile: profileResult.data,
      tasks: tasksResult.data ?? [],
      notes: notesResult.data ?? [],
      transactions: financeResult.data ?? [],
      records: recordsResult.data ?? [],
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    return responseError(error, 401);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, userId } = await getMiniAppContext(request.headers.get("x-telegram-init-data"));
    const parsed = mutationSchema.safeParse(await request.json());
    if (!parsed.success) return responseError(new Error(parsed.error.issues[0]?.message ?? "Invalid action."), 400);
    const data = parsed.data;

    if (data.resource === "task") {
      const { data: reminder } = await supabase
        .from("reminders")
        .select("*")
        .eq("id", data.id)
        .eq("user_id", userId)
        .maybeSingle<Reminder>();
      if (!reminder) return responseError(new Error("Task not found."), 404);

      if (data.action === "complete" || data.action === "incomplete") {
        const occurrenceStatus = data.action === "complete" ? "completed" : "incomplete";
        const { data: dueOccurrence } = await supabase
          .from("task_occurrences")
          .select("id,due_at")
          .eq("reminder_id", data.id)
          .eq("user_id", userId)
          .eq("status", "pending")
          .lte("due_at", new Date().toISOString())
          .order("due_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        const occurrenceDueAt = dueOccurrence?.due_at ?? reminder.due_at;
        const resolvingCurrentOccurrence = new Date(occurrenceDueAt).getTime() === new Date(reminder.due_at).getTime();
        await supabase
          .from("task_occurrences")
          .update({ status: occurrenceStatus, completed_at: data.action === "complete" ? new Date().toISOString() : null })
          .eq("reminder_id", data.id)
          .eq("user_id", userId)
          .eq("due_at", occurrenceDueAt);
        if (reminder.recurrence_type === "none") {
          await Promise.all([
            supabase.from("reminders").update(data.action === "complete" ? { status: "completed", completed_at: new Date().toISOString() } : { status: "cancelled" }).eq("id", data.id).eq("user_id", userId),
            supabase.from("notification_deliveries").update({ delivery_status: "cancelled" }).eq("reminder_id", data.id).eq("delivery_status", "pending")
          ]);
        } else if (resolvingCurrentOccurrence) {
          const next = nextRecurringDelivery(reminder);
          if (next) {
            await supabase.from("reminders").update({ due_at: next.dueAt.toISOString(), next_occurrence_at: next.dueAt.toISOString() }).eq("id", data.id).eq("user_id", userId);
            await supabase.from("notification_deliveries").insert({ reminder_id: data.id, user_id: userId, scheduled_for: next.scheduledFor.toISOString(), delivery_status: "pending" });
          } else {
            await supabase.from("reminders").update(data.action === "complete" ? { status: "completed", completed_at: new Date().toISOString() } : { status: "cancelled" }).eq("id", data.id).eq("user_id", userId);
          }
        }
      } else if (data.action === "snooze") {
        await supabase.from("notification_deliveries").insert(buildSnoozeDelivery(data.id, userId, data.minutes ?? 10));
      } else if (data.action === "archive") {
        await Promise.all([
          supabase.from("reminders").update({ status: "archived", archived_at: new Date().toISOString() }).eq("id", data.id).eq("user_id", userId),
          supabase.from("notification_deliveries").update({ delivery_status: "cancelled" }).eq("reminder_id", data.id).eq("delivery_status", "pending")
        ]);
      } else {
        await supabase.from("notification_deliveries").delete().eq("reminder_id", data.id).eq("user_id", userId);
        await supabase.from("reminders").delete().eq("id", data.id).eq("user_id", userId);
      }
    }

    if (data.resource === "note" && data.action === "create") {
      const note = noteSchema.safeParse(data);
      if (!note.success) return responseError(new Error(note.error.issues[0]?.message ?? "Invalid note."), 400);
      const { error } = await supabase.from("notes").insert({ user_id: userId, ...note.data });
      if (error) throw error;
    } else if (data.resource === "note") {
      if (data.action === "delete") {
        await supabase.from("notes").delete().eq("id", data.id).eq("user_id", userId);
      } else {
        const field = data.action === "pin" ? "is_pinned" : "is_archived";
        await supabase.from("notes").update({ [field]: data.value ?? true }).eq("id", data.id).eq("user_id", userId);
      }
    }

    if (data.resource === "finance" && data.action === "create") {
      const transaction = transactionSchema.safeParse(data);
      if (!transaction.success) return responseError(new Error(transaction.error.issues[0]?.message ?? "Invalid transaction."), 400);
      const { error } = await supabase.from("finance_transactions").insert({
        user_id: userId,
        transaction_type: transaction.data.transactionType,
        amount: transaction.data.amount,
        category: transaction.data.category,
        description: transaction.data.description || null,
        transaction_date: transaction.data.transactionDate,
        currency: transaction.data.currency.toUpperCase()
      });
      if (error) throw error;
    } else if (data.resource === "finance") {
      await supabase.from("finance_transactions").delete().eq("id", data.id).eq("user_id", userId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return responseError(error);
  }
}
