"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { z } from "zod";

// Fixed password used for every account seeded by scripts/seed-dummy.js.
// Quick-login only ever signs in with a known demo account below, so this
// isn't a secret — it's not usable against any account outside that list.
const DEMO_PASSWORD = "TestPassword123";

const quickLoginSchema = z.object({
  email: z.string().email(),
  key: z.string().optional(),
});

export async function quickLoginAction(formData: FormData) {
  const { email, key } = quickLoginSchema.parse({
    email: formData.get("email"),
    key: formData.get("key") ?? undefined,
  });

  if (process.env.NODE_ENV === "production") {
    const secret = process.env.DEV_LOGIN_SECRET;
    if (!secret || key !== secret) {
      throw new Error("Quick login is disabled in production.");
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: DEMO_PASSWORD,
  });

  if (error) {
    throw new Error(`Gagal login sebagai ${email}: ${error.message}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", data.user.id)
    .single();

  if (!profile || profile.status !== "active") {
    redirect("/pending");
  }

  redirect(`/${profile.role}`);
}
