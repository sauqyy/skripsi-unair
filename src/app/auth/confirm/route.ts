import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

/**
 * Target of the "Confirm signup" link in Supabase's email template. Exchanges
 * the token_hash for a real session (setting the sb-* cookies) then sends the
 * user on to `next` (defaults to /pending, since a brand-new account is still
 * unapproved). Configure the template in Supabase Dashboard → Authentication
 * → Email Templates → Confirm signup, ConfirmationURL should be:
 *
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/pending
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/pending";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      redirect(next);
    }
  }

  redirect("/login?error=Link konfirmasi tidak valid atau sudah kedaluwarsa");
}
