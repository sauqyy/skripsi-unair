"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Koordinator sets/edits the deadline for a mahasiswa's stage. Ensures a
 * skripsi_progress row exists (creates it as 'belum' if missing) then writes
 * the deadline. RLS: only koordinator can write here.
 */
const setDeadlineSchema = z.object({
  skripsiId: z.string().uuid(),
  stageId: z.string().uuid(),
  deadline: z.string().optional(),
  redirectPath: z.string(),
});

export async function setStageDeadlineAction(formData: FormData) {
  const parsed = setDeadlineSchema.parse({
    skripsiId: formData.get("skripsiId"),
    stageId: formData.get("stageId"),
    deadline: formData.get("deadline") || undefined,
    redirectPath: formData.get("redirectPath"),
  });

  const supabase = await createClient();

  const { error } = await supabase.from("skripsi_progress").upsert(
    {
      skripsi_id: parsed.skripsiId,
      stage_id: parsed.stageId,
      deadline: parsed.deadline ?? null,
    },
    { onConflict: "skripsi_id,stage_id" }
  );

  if (error) throw new Error(error.message);

  revalidatePath(parsed.redirectPath);
}

/**
 * Dosen creates the skripsi_progress row for a stage the first time (e.g. no
 * deadline has been set yet by koordinator), so status updates have a row to
 * act on.
 */
const initProgressSchema = z.object({
  skripsiId: z.string().uuid(),
  stageId: z.string().uuid(),
  status: z.enum(["belum", "proses", "selesai", "disetujui"]),
  redirectPath: z.string(),
});

export async function initProgressAction(formData: FormData) {
  const parsed = initProgressSchema.parse({
    skripsiId: formData.get("skripsiId"),
    stageId: formData.get("stageId"),
    status: formData.get("status"),
    redirectPath: formData.get("redirectPath"),
  });

  const supabase = await createClient();
  const { error } = await supabase.from("skripsi_progress").upsert(
    {
      skripsi_id: parsed.skripsiId,
      stage_id: parsed.stageId,
      status: parsed.status,
      tanggal_mulai: new Date().toISOString().slice(0, 10),
    },
    { onConflict: "skripsi_id,stage_id" }
  );

  if (error) throw new Error(error.message);
  revalidatePath(parsed.redirectPath);
}

/**
 * Dosen (or koordinator) updates a stage's status, optionally approving it
 * (which also advances skripsi.current_stage_id when marking selesai/disetujui).
 */
const updateStatusSchema = z.object({
  progressId: z.string().uuid(),
  skripsiId: z.string().uuid(),
  stageId: z.string().uuid(),
  status: z.enum(["belum", "proses", "selesai", "disetujui"]),
  redirectPath: z.string(),
});

export async function updateProgressStatusAction(formData: FormData) {
  const parsed = updateStatusSchema.parse({
    progressId: formData.get("progressId"),
    skripsiId: formData.get("skripsiId"),
    stageId: formData.get("stageId"),
    status: formData.get("status"),
    redirectPath: formData.get("redirectPath"),
  });

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDone = parsed.status === "selesai" || parsed.status === "disetujui";

  const { error } = await supabase
    .from("skripsi_progress")
    .update({
      status: parsed.status,
      tanggal_selesai: isDone ? new Date().toISOString().slice(0, 10) : null,
      approved_by: parsed.status === "disetujui" ? user?.id : null,
    })
    .eq("id", parsed.progressId);

  if (error) throw new Error(error.message);

  if (isDone) {
    // Advance current_stage_id to the next stage in urutan, if any.
    const { data: stage } = await supabase
      .from("stages")
      .select("urutan")
      .eq("id", parsed.stageId)
      .single();

    if (stage) {
      const { data: nextStage } = await supabase
        .from("stages")
        .select("id")
        .gt("urutan", stage.urutan)
        .order("urutan", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextStage) {
        await supabase
          .from("skripsi")
          .update({ current_stage_id: nextStage.id })
          .eq("id", parsed.skripsiId);
      }
    }
  }

  revalidatePath(parsed.redirectPath);
}
