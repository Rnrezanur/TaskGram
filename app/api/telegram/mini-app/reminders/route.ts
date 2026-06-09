import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildInitialDelivery } from "@/lib/reminders/schedule";
import { zonedDateTimeToUtc } from "@/lib/time";
import { getMiniAppContext } from "@/lib/telegram/mini-app";

export const runtime = "nodejs";
export const preferredRegion = "sin1";

const schema = z.object({
  title: z.string().trim().min(1).max(140),
  description: z.string().max(2000).optional().default(""),
  date: z.string().min(1),
  time: z.string().min(1),
  priority: z.enum(["low", "medium", "high"]),
  category: z.enum(["personal", "study", "work", "health", "finance"]),
  reminderMinutesBefore: z.coerce.number().int().min(0).max(10080),
  recurrenceType: z.enum(["none", "daily", "weekly", "monthly"])
});

export async function POST(request: NextRequest) {
  try {
    const { supabase, userId } = await getMiniAppContext(request.headers.get("x-telegram-init-data"));
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid task." }, { status: 400 });

    const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", userId).single();
    const timezone = profile?.timezone || "Asia/Dhaka";
    const dueAt = zonedDateTimeToUtc(parsed.data.date, parsed.data.time, timezone);
    if (dueAt.getTime() <= Date.now()) return NextResponse.json({ error: "Choose a future date and time." }, { status: 400 });

    const { data: reminder, error: reminderError } = await supabase
      .from("reminders")
      .insert({
        user_id: userId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        category: parsed.data.category,
        priority: parsed.data.priority,
        due_at: dueAt.toISOString(),
        timezone,
        reminder_minutes_before: parsed.data.reminderMinutesBefore,
        telegram_enabled: true,
        recurrence_type: parsed.data.recurrenceType,
        recurrence_interval: parsed.data.recurrenceType === "none" ? null : 1,
        next_occurrence_at: parsed.data.recurrenceType === "none" ? null : dueAt.toISOString()
      })
      .select("id")
      .single();

    if (reminderError) throw reminderError;

    const { error: deliveryError } = await supabase
      .from("notification_deliveries")
      .insert(buildInitialDelivery(reminder.id, userId, dueAt, parsed.data.reminderMinutesBefore));
    if (deliveryError) throw deliveryError;

    return NextResponse.json({ success: true, reminderId: reminder.id });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create task." }, { status: 500 });
  }
}
