import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2 font-bold", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <CheckCheck className="h-5 w-5" />
      </span>
      <span>TaskGram</span>
    </Link>
  );
}
