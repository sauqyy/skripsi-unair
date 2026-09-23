"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleEmailReminderAction(formData: FormData) {
  const optIn = formData.get("optIn") === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Tidak ada sesi login.");

  const { error } = await supabase
    .from("profiles")
    .update({ email_reminder_optin: optIn })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dosen/settings");
}
