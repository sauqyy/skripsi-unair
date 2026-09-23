import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Admin client using the SERVICE ROLE key — bypasses Row Level Security.
 *
 * Server-only. Never import this from a Client Component or expose the
 * service role key to the browser. Used for:
 *  - the daily cron route that scans deadlines and sends reminder emails
 *  - coordinator actions that must read/write across all users (e.g. approving
 *    a pending account before that user has any RLS-visible rows yet)
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
