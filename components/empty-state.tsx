import { Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({ title, text }: { title: string; text: string }) {
  return <Card><CardContent className="flex flex-col items-center justify-center p-10 text-center"><Inbox className="h-10 w-10 text-muted-foreground" /><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 max-w-sm text-sm text-muted-foreground">{text}</p></CardContent></Card>;
}
