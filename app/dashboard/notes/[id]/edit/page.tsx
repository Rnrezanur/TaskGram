import { notFound } from "next/navigation";
import { NoteForm } from "@/components/notes/note-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateNoteAction } from "@/lib/actions/notes";
import { createClient } from "@/lib/supabase/server";
import type { Note } from "@/lib/types";

export default async function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: note } = await supabase.from("notes").select("*").eq("id", id).eq("user_id", user!.id).maybeSingle<Note>();
  if (!note) notFound();
  return <Card className="mx-auto max-w-3xl"><CardHeader><CardTitle>Edit note</CardTitle></CardHeader><CardContent><NoteForm action={updateNoteAction.bind(null, id)} initial={note} /></CardContent></Card>;
}
