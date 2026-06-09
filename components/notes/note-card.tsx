import Link from "next/link";
import { Archive, ArchiveRestore, Pin, PinOff, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { archiveNoteAction, deleteNoteAction, toggleNotePinAction } from "@/lib/actions/notes";
import { cn } from "@/lib/utils";
import type { Note } from "@/lib/types";

const colorStyles = {
  default: "bg-card",
  blue: "border-sky-300 bg-sky-50 dark:bg-sky-950/40",
  green: "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40",
  amber: "border-amber-300 bg-amber-50 dark:bg-amber-950/40",
  rose: "border-rose-300 bg-rose-50 dark:bg-rose-950/40"
};

export function NoteCard({ note }: { note: Note }) {
  return (
    <Card className={cn("break-inside-avoid", colorStyles[note.color])}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">{note.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">Updated {new Date(note.updated_at).toLocaleDateString()}</p>
          </div>
          {note.is_pinned && <Pin className="h-4 w-4 text-primary" />}
        </div>
        {note.content && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{note.content}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          <form action={toggleNotePinAction.bind(null, note.id, note.is_pinned)}><Button size="icon" variant="outline" title={note.is_pinned ? "Unpin" : "Pin"}>{note.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}</Button></form>
          <Button asChild size="icon" variant="outline" title="Edit"><Link href={`/dashboard/notes/${note.id}/edit`}><Pencil className="h-4 w-4" /></Link></Button>
          <form action={archiveNoteAction.bind(null, note.id, note.is_archived)}><Button size="icon" variant="outline" title={note.is_archived ? "Restore" : "Archive"}>{note.is_archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}</Button></form>
          <form action={deleteNoteAction.bind(null, note.id)}><Button size="icon" variant="destructive" title="Delete"><Trash2 className="h-4 w-4" /></Button></form>
        </div>
      </CardContent>
    </Card>
  );
}
