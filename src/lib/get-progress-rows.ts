import { createClient } from "@/lib/supabase/server";
import type { ProgressRow } from "@/components/progress-tracker";

/**
 * Builds one row per master `stage`, left-joined with this skripsi's
 * `skripsi_progress` row if it exists yet (koordinator may not have set a
 * deadline / dosen may not have started that stage).
 */
export async function getProgressRows(skripsiId: string): Promise<ProgressRow[]> {
  const supabase = await createClient();

  const [{ data: stages }, { data: progress }] = await Promise.all([
    supabase.from("stages").select("*").order("urutan"),
    supabase.from("skripsi_progress").select("*").eq("skripsi_id", skripsiId),
  ]);

  const progressByStage = new Map((progress ?? []).map((p) => [p.stage_id, p]));

  return (stages ?? []).map((stage) => {
    const p = progressByStage.get(stage.id);
    return {
      id: p?.id ?? null,
      stage,
      status: p?.status ?? "belum",
      deadline: p?.deadline ?? null,
      tanggal_selesai: p?.tanggal_selesai ?? null,
    };
  });
}
