import { Badge } from "@/components/ui/badge";

export function PriorityBadge({ priority }: { priority: string }) {
  const styles = priority === "high" ? "border-red-300 bg-red-50 text-red-700 dark:bg-red-950" : priority === "medium" ? "border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-950" : "border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950";
  return <Badge className={styles}>{priority}</Badge>;
}

export function CategoryBadge({ category }: { category: string }) {
  return <Badge className="bg-muted text-muted-foreground">{category}</Badge>;
}
