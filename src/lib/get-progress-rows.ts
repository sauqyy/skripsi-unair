import { createClient } from "@/lib/supabase/server";
import type { ProgressRow } from "@/components/progress-tracker";

/**
 * Builds one row per master `stage`, left-joined with this skripsi's
 * `skripsi_progress` row if it exists yet (koordinator may not have set a
 * deadline / dosen may not have started that stage), plus how many
 * bimbingan sessions have happened for that stage so far (a stage is
 * commonly revisited many times before it's approved).
 */
export async function getProgressRows(skripsiId: string): Promise<ProgressRow[]> {
  const supabase = await createClient();

  const [{ data: stages }, { data: progress }, { data: bimbingan }] = await Promise.all([
    supabase.from("stages").select("*").order("urutan"),
    supabase.from("skripsi_progress").select("*").eq("skripsi_id", skripsiId),
    supabase.from("bimbingan").select("stage_id, status").eq("skripsi_id", skripsiId),
  ]);

  const progressByStage = new Map((progress ?? []).map((p) => [p.stage_id, p]));

  const bimbinganCountByStage = new Map<string, number>();
  for (const b of bimbingan ?? []) {
    if (b.status !== "selesai") continue;
    bimbinganCountByStage.set(b.stage_id, (bimbinganCountByStage.get(b.stage_id) ?? 0) + 1);
  }

  return (stages ?? []).map((stage) => {
    const p = progressByStage.get(stage.id);
    return {
      id: p?.id ?? null,
      stage,
      status: p?.status ?? "belum",
      deadline: p?.deadline ?? null,
      tanggal_selesai: p?.tanggal_selesai ?? null,
      jumlahBimbingan: bimbinganCountByStage.get(stage.id) ?? 0,
    };
  });
}
