import Link from "next/link";
import { Archive, NotebookPen, Search } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { NoteCard } from "@/components/notes/note-card";
import { NoteForm } from "@/components/notes/note-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createNoteAction } from "@/lib/actions/notes";
import { createClient } from "@/lib/supabase/server";
import type { Note } from "@/lib/types";

export default async function NotesPage({ searchParams }: { searchParams: Promise<{ q?: string; archived?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let query = supabase.from("notes").select("*").eq("user_id", user!.id).eq("is_archived", params.archived === "true").order("is_pinned", { ascending: false }).order("updated_at", { ascending: false }).limit(100);
  if (params.q) query = query.or(`title.ilike.%${params.q}%,content.ilike.%${params.q}%`);
  const { data } = await query.returns<Note[]>();
  const notes = data ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-3xl font-bold">Notes</h1><p className="text-muted-foreground">Capture ideas, plans, references, and anything worth keeping.</p></div>
          <Button asChild variant="outline"><Link href={params.archived === "true" ? "/dashboard/notes" : "/dashboard/notes?archived=true"}><Archive className="h-4 w-4" />{params.archived === "true" ? "Active notes" : "Archived"}</Link></Button>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card className="h-fit xl:sticky xl:top-6">
          <CardHeader><CardTitle className="flex items-center gap-2"><NotebookPen className="h-5 w-5 text-primary" />Quick note</CardTitle></CardHeader>
          <CardContent><NoteForm action={createNoteAction} compact /></CardContent>
        </Card>
        <section className="space-y-4">
          <form className="flex gap-2"><Input name="q" placeholder="Search notes" defaultValue={params.q ?? ""} /><input type="hidden" name="archived" value={params.archived ?? "false"} /><Button variant="outline"><Search className="h-4 w-4" />Search</Button></form>
          {notes.length ? <div className="columns-1 gap-4 space-y-4 md:columns-2 2xl:columns-3">{notes.map((note) => <NoteCard key={note.id} note={note} />)}</div> : <EmptyState title="No notes yet" text="Create a quick note to keep an idea, plan, or useful reference." />}
        </section>
      </div>
    </div>
  );
}
