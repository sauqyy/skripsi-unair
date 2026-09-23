"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const stageSchema = z.object({
  nama: z.string().min(2),
  urutan: z.coerce.number().int().min(1),
  deskripsi: z.string().optional(),
});

export async function createStageAction(formData: FormData) {
  const parsed = stageSchema.parse({
    nama: formData.get("nama"),
    urutan: formData.get("urutan"),
    deskripsi: formData.get("deskripsi") || undefined,
  });

  const supabase = await createClient();
  const { error } = await supabase.from("stages").insert(parsed);
  if (error) throw new Error(error.message);

  revalidatePath("/koordinator/tahapan");
}

export async function deleteStageAction(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.from("stages").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/koordinator/tahapan");
}
