"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { noteSchema } from "@/lib/validations/workspace";

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

function noteValues(formData: FormData) {
  return {
    title: formData.get("title"),
    content: formData.get("content") || "",
    color: formData.get("color") || "default"
  };
}

export async function createNoteAction(_: unknown, formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = noteSchema.safeParse(noteValues(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid note." };

  const { error } = await supabase.from("notes").insert({
    user_id: user.id,
    title: parsed.data.title,
    content: parsed.data.content,
    color: parsed.data.color
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard/notes");
  return { success: "Note saved." };
}

export async function updateNoteAction(id: string, _: unknown, formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = noteSchema.safeParse(noteValues(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid note." };

  const { error } = await supabase.from("notes").update(parsed.data).eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/notes");
  redirect("/dashboard/notes");
}

export async function toggleNotePinAction(id: string, pinned: boolean) {
  const { supabase, user } = await requireUser();
  await supabase.from("notes").update({ is_pinned: !pinned }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard/notes");
}

export async function archiveNoteAction(id: string, archived: boolean) {
  const { supabase, user } = await requireUser();
  await supabase.from("notes").update({ is_archived: !archived }).eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard/notes");
}

export async function deleteNoteAction(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("notes").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/dashboard/notes");
}
