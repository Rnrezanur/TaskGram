import { redirect } from "next/navigation";
import { MobileNavigation, Sidebar } from "@/components/dashboard/navigation";
import { isAdminEmail } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export const preferredRegion = "sin1";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const name = profile?.full_name || user.email || "TaskGram user";
  const isAdmin = isAdminEmail(user.email);
  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar userName={name} isAdmin={isAdmin} />
      <main className="pb-28 lg:ml-72 lg:pb-0">
        <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8">{children}</div>
      </main>
      <MobileNavigation isAdmin={isAdmin} />
    </div>
  );
}
