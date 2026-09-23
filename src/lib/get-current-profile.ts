import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

/**
 * Returns the logged-in user's `profiles` row, or null if no one is logged in.
 * Use this in Server Components / layouts to branch on role + status.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}
