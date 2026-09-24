import { Badge } from "@/components/ui/badge";
import type { BimbinganStatus, Stage } from "@/types/database";

export interface BimbinganEntry {
  id: string;
  stage_id: string;
  pertemuan_ke: number;
  tanggal: string;
  dosenNama: string;
  topik: string | null;
  catatan_revisi: string | null;
  status: BimbinganStatus;
}

const statusTone: Record<BimbinganStatus, "green" | "red" | "yellow"> = {
  selesai: "green",
  ditolak: "red",
  diajukan: "yellow",
};

/**
 * Renders bimbingan history grouped by stage — a stage is commonly revisited
 * many times before it's approved, so a flat list quickly becomes unreadable
 * once a mahasiswa has had a dozen+ sessions total.
 */
export function BimbinganHistoryByStage({
  stages,
  entries,
  renderActions,
}: {
  stages: Stage[];
  entries: BimbinganEntry[];
  /** Optional per-entry action area (e.g. dosen's "Selesaikan / Tolak" form). */
  renderActions?: (entry: BimbinganEntry) => React.ReactNode;
}) {
  const byStage = new Map<string, BimbinganEntry[]>();
  for (const entry of entries) {
    const arr = byStage.get(entry.stage_id) ?? [];
    arr.push(entry);
    byStage.set(entry.stage_id, arr);
  }

  const stagesWithEntries = stages.filter((s) => (byStage.get(s.id) ?? []).length > 0);

  if (stagesWithEntries.length === 0) {
    return <p className="text-sm text-slate-400">Belum ada riwayat bimbingan.</p>;
  }

  return (
    <div className="space-y-5">
      {stagesWithEntries.map((stage) => {
        const stageEntries = [...(byStage.get(stage.id) ?? [])].sort(
          (a, b) => b.pertemuan_ke - a.pertemuan_ke
        );
        const selesaiCount = stageEntries.filter((e) => e.status === "selesai").length;

        return (
          <div key={stage.id}>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">{stage.nama}</h3>
              <Badge tone="blue">{selesaiCount}x selesai</Badge>
            </div>
            <div className="space-y-2">
              {stageEntries.map((b) => (
                <div key={b.id} className="rounded-md border border-slate-100 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-900">
                      Pertemuan ke-{b.pertemuan_ke} · {b.tanggal}
                    </p>
                    <Badge tone={statusTone[b.status]}>{b.status}</Badge>
                  </div>
                  <p className="mt-1 text-slate-600">Dosen: {b.dosenNama}</p>
                  {b.topik && <p className="mt-1 text-slate-600">Topik: {b.topik}</p>}
                  {b.catatan_revisi && (
                    <p className="mt-1 text-slate-600">Catatan revisi: {b.catatan_revisi}</p>
                  )}
                  {renderActions?.(b)}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
