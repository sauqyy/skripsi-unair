"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const setAssignmentSchema = z.object({
  mahasiswaId: z.string().uuid(),
  pembimbingKe: z.enum(["1", "2"]),
  dosenId: z.string().uuid().or(z.literal("")),
});

export async function setAssignmentAction(formData: FormData) {
  const parsed = setAssignmentSchema.parse({
    mahasiswaId: formData.get("mahasiswaId"),
    pembimbingKe: formData.get("pembimbingKe"),
    dosenId: formData.get("dosenId"),
  });

  const supabase = await createClient();

  if (!parsed.dosenId) {
    // Empty selection = remove this pembimbing slot.
    await supabase
      .from("bimbingan_assignments")
      .delete()
      .eq("mahasiswa_id", parsed.mahasiswaId)
      .eq("pembimbing_ke", parsed.pembimbingKe);
  } else {
    const { error } = await supabase.from("bimbingan_assignments").upsert(
      {
        mahasiswa_id: parsed.mahasiswaId,
        pembimbing_ke: parsed.pembimbingKe,
        dosen_id: parsed.dosenId,
      },
      { onConflict: "mahasiswa_id,pembimbing_ke" }
    );
    if (error) throw new Error(error.message);

    // Make sure a `skripsi` row exists for this mahasiswa so progress can be tracked.
    await supabase
      .from("skripsi")
      .upsert({ mahasiswa_id: parsed.mahasiswaId }, { onConflict: "mahasiswa_id", ignoreDuplicates: true });
  }

  revalidatePath("/koordinator/assignment");
}
