import Link from "next/link";
import { Bell, CalendarDays, Home, ListChecks, MessageCircle, Shield, Settings } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/actions/auth";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/reminders", label: "Reminders", icon: ListChecks },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/telegram", label: "Telegram", icon: MessageCircle },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

export function Sidebar({ userName, isAdmin = false }: { userName: string; isAdmin?: boolean }) {
  const items = isAdmin ? [...nav, { href: "/admin", label: "Admin", icon: Shield }] : nav;
  return (
    <aside className="fixed inset-y-0 left-0 hidden w-72 border-r bg-card p-5 lg:block">
      <AppLogo className="text-xl" />
      <nav className="mt-8 space-y-1">
        {items.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
            <Icon className="h-4 w-4" />{label}
          </Link>
        ))}
      </nav>
      <div className="absolute bottom-5 left-5 right-5 space-y-3">
        <div className="rounded-lg border p-3 text-sm"><p className="font-medium">{userName}</p><p className="text-muted-foreground">Signed in</p></div>
        <div className="flex gap-2"><ThemeToggle /><form action={logoutAction} className="flex-1"><Button variant="outline" className="w-full">Logout</Button></form></div>
      </div>
    </aside>
  );
}

export function MobileNavigation({ isAdmin = false }: { isAdmin?: boolean }) {
  const items = isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }, ...nav.slice(0, 4)] : nav.slice(0, 5);
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t bg-card p-2 lg:hidden">
      {items.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className="flex flex-col items-center gap-1 rounded-md p-2 text-[11px] text-muted-foreground">
          <Icon className="h-5 w-5" /><span>{label.split(" ")[0]}</span>
        </Link>
      ))}
    </nav>
  );
}
