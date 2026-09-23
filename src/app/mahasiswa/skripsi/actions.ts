"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateSchema = z.object({
  judul: z.string().min(3),
  abstrak: z.string().optional(),
});

export async function updateSkripsiAction(formData: FormData) {
  const parsed = updateSchema.parse({
    judul: formData.get("judul"),
    abstrak: formData.get("abstrak") || undefined,
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Tidak ada sesi login.");

  const { error } = await supabase
    .from("skripsi")
    .update({ judul: parsed.judul, abstrak: parsed.abstrak })
    .eq("mahasiswa_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/mahasiswa/skripsi");
  revalidatePath("/mahasiswa");
}
