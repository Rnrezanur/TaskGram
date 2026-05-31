import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { invariantEnv } from "@/lib/utils";

export async function createClient() {
  const cookieStore = await cookies();
  type CookieToSet = { name: string; value: string; options: Parameters<typeof cookieStore.set>[2] };

  return createServerClient(
    invariantEnv("NEXT_PUBLIC_SUPABASE_URL"),
    invariantEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server components cannot set cookies; middleware refreshes sessions.
          }
        }
      }
    }
  );
}

export function createServiceClient() {
  return createSupabaseClient(invariantEnv("NEXT_PUBLIC_SUPABASE_URL"), invariantEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
