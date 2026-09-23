import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  initProgressAction,
  setStageDeadlineAction,
  updateProgressStatusAction,
} from "@/lib/actions/progress-actions";
import type { ProgressStatus, Stage } from "@/types/database";

const statusTone: Record<ProgressStatus, "slate" | "blue" | "green" | "yellow"> = {
  belum: "slate",
  proses: "blue",
  selesai: "green",
  disetujui: "green",
};

const statusLabel: Record<ProgressStatus, string> = {
  belum: "Belum mulai",
  proses: "Sedang berjalan",
  selesai: "Selesai",
  disetujui: "Disetujui",
};

export interface ProgressRow {
  id: string | null; // null if no skripsi_progress row exists yet
  stage: Stage;
  status: ProgressStatus;
  deadline: string | null;
  tanggal_selesai: string | null;
}

export function ProgressTracker({
  skripsiId,
  rows,
  editableDeadline,
  editableStatus,
  redirectPath,
}: {
  skripsiId: string;
  rows: ProgressRow[];
  editableDeadline: boolean;
  editableStatus: boolean;
  redirectPath: string;
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const isOverdue =
          row.deadline && row.deadline < today && row.status !== "selesai" && row.status !== "disetujui";

        return (
          <div
            key={row.stage.id}
            className="flex flex-col gap-3 rounded-md border border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">
                {row.stage.urutan}. {row.stage.nama}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge tone={statusTone[row.status]}>{statusLabel[row.status]}</Badge>
                {row.deadline && (
                  <Badge tone={isOverdue ? "red" : "slate"}>Deadline: {row.deadline}</Badge>
                )}
                {row.tanggal_selesai && (
                  <span className="text-xs text-slate-400">Selesai: {row.tanggal_selesai}</span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {editableDeadline && (
                <form action={setStageDeadlineAction} className="flex items-center gap-2">
                  <input type="hidden" name="skripsiId" value={skripsiId} />
                  <input type="hidden" name="stageId" value={row.stage.id} />
                  <input type="hidden" name="redirectPath" value={redirectPath} />
                  <Input
                    type="date"
                    name="deadline"
                    defaultValue={row.deadline ?? ""}
                    className="w-40"
                  />
                  <Button type="submit" size="sm" variant="secondary">
                    Set Deadline
                  </Button>
                </form>
              )}

              {editableStatus && !row.id && (
                <form action={initProgressAction}>
                  <input type="hidden" name="skripsiId" value={skripsiId} />
                  <input type="hidden" name="stageId" value={row.stage.id} />
                  <input type="hidden" name="status" value="proses" />
                  <input type="hidden" name="redirectPath" value={redirectPath} />
                  <Button type="submit" size="sm" variant="secondary">
                    Mulai Tahap Ini
                  </Button>
                </form>
              )}

              {editableStatus && row.id && (
                <form action={updateProgressStatusAction} className="flex items-center gap-2">
                  <input type="hidden" name="progressId" value={row.id} />
                  <input type="hidden" name="skripsiId" value={skripsiId} />
                  <input type="hidden" name="stageId" value={row.stage.id} />
                  <input type="hidden" name="redirectPath" value={redirectPath} />
                  <Select name="status" defaultValue={row.status} className="w-40">
                    <option value="belum">Belum mulai</option>
                    <option value="proses">Sedang berjalan</option>
                    <option value="selesai">Selesai</option>
                    <option value="disetujui">Disetujui</option>
                  </Select>
                  <Button type="submit" size="sm" variant="secondary">
                    Update
                  </Button>
                </form>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
