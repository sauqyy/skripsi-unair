"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const decisionSchema = z.object({
  profileId: z.string().uuid(),
  decision: z.enum(["active", "rejected"]),
});

export async function decideAccountAction(formData: FormData) {
  const parsed = decisionSchema.parse({
    profileId: formData.get("profileId"),
    decision: formData.get("decision"),
  });

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ status: parsed.decision })
    .eq("id", parsed.profileId);

  if (error) throw new Error(error.message);

  if (parsed.decision === "active") {
    await supabase.from("notifications").insert({
      user_id: parsed.profileId,
      pesan: "Akun kamu telah disetujui koordinator. Selamat datang!",
      tipe: "sistem",
    });
  } else {
    await supabase.from("notifications").insert({
      user_id: parsed.profileId,
      pesan: "Pendaftaran akun kamu ditolak oleh koordinator.",
      tipe: "sistem",
    });
  }

  revalidatePath("/koordinator/verifikasi");
  revalidatePath("/koordinator");
}
