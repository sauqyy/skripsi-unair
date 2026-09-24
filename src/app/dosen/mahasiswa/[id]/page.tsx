import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { getProgressRows } from "@/lib/get-progress-rows";
import { ProgressTracker } from "@/components/progress-tracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { DownloadDocumentButton } from "@/components/download-document-button";
import { completeBimbinganAction, logBimbinganAction } from "@/lib/actions/bimbingan-actions";
import { BimbinganHistoryByStage, type BimbinganEntry } from "@/components/bimbingan-history";
import { notFound, redirect } from "next/navigation";

export default async function DosenMahasiswaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("bimbingan_assignments")
    .select("*")
    .eq("mahasiswa_id", id)
    .eq("dosen_id", profile!.id)
    .maybeSingle();

  if (!assignment) redirect("/dosen/mahasiswa");

  const { data: mahasiswa } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (!mahasiswa) notFound();

  const { data: skripsi } = await supabase
    .from("skripsi")
    .select("*")
    .eq("mahasiswa_id", id)
    .maybeSingle();

  const redirectPath = `/dosen/mahasiswa/${id}`;

  const [{ data: documents }, { data: bimbinganList }, { data: stages }] = await Promise.all([
    skripsi
      ? supabase.from("documents").select("*").eq("skripsi_id", skripsi.id).order("versi", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
    skripsi
      ? supabase
          .from("bimbingan")
          .select("*, profiles!bimbingan_dosen_id_fkey(nama)")
          .eq("skripsi_id", skripsi.id)
          .order("pertemuan_ke", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
    supabase.from("stages").select("*").order("urutan"),
  ]);

  const progressRows = skripsi ? await getProgressRows(skripsi.id) : [];
  const totalSelesai = (bimbinganList ?? []).filter((b) => b.status === "selesai").length;

  const bimbinganEntries: BimbinganEntry[] = (bimbinganList ?? []).map((b) => ({
    id: b.id,
    stage_id: b.stage_id,
    pertemuan_ke: b.pertemuan_ke,
    tanggal: b.tanggal,
    dosenNama: (b.profiles as unknown as { nama: string } | null)?.nama ?? "-",
    topik: b.topik,
    catatan_revisi: b.catatan_revisi,
    status: b.status,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{mahasiswa.nama}</h1>
          <p className="text-sm text-slate-500">
            {mahasiswa.nim_nip} · {mahasiswa.prodi} · Pembimbing {assignment.pembimbing_ke}
          </p>
        </div>
        {skripsi && (
          <LinkButton href={`/api/kartu-bimbingan/${skripsi.id}`} variant="secondary">
            Ekspor Kartu Bimbingan (PDF)
          </LinkButton>
        )}
      </div>

      {!skripsi ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-slate-400">
            Data skripsi mahasiswa ini belum tersedia.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{skripsi.judul ?? "Judul belum diisi"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                {skripsi.abstrak ?? <span className="text-slate-400">Abstrak belum diisi.</span>}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Progress Tahapan</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressTracker
                skripsiId={skripsi.id}
                rows={progressRows}
                editableDeadline={false}
                editableStatus
                redirectPath={redirectPath}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dokumen PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(!documents || documents.length === 0) && (
                <p className="text-sm text-slate-400">Belum ada dokumen diunggah.</p>
              )}
              {(documents ?? []).map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">
                      {d.nama_file} <Badge tone="slate">v{d.versi}</Badge>
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(d.uploaded_at).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <DownloadDocumentButton storagePath={d.storage_path} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Riwayat Bimbingan per Tahap — total {totalSelesai} kali selesai</CardTitle>
            </CardHeader>
            <CardContent>
              <BimbinganHistoryByStage
                stages={stages ?? []}
                entries={bimbinganEntries}
                renderActions={(b) =>
                  b.status === "diajukan" ? (
                    <form action={completeBimbinganAction} className="mt-2 space-y-2">
                      <input type="hidden" name="bimbinganId" value={b.id} />
                      <input type="hidden" name="mahasiswaId" value={id} />
                      <input type="hidden" name="redirectPath" value={redirectPath} />
                      <Textarea
                        name="catatanRevisi"
                        placeholder="Catatan / hal yang perlu direvisi..."
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button type="submit" name="status" value="selesai" size="sm">
                          Selesaikan
                        </Button>
                        <Button type="submit" name="status" value="ditolak" size="sm" variant="danger">
                          Tolak
                        </Button>
                      </div>
                    </form>
                  ) : null
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Catat Sesi Bimbingan (Offline)</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={logBimbinganAction} className="space-y-4">
                <input type="hidden" name="skripsiId" value={skripsi.id} />
                <input type="hidden" name="mahasiswaId" value={id} />
                <input type="hidden" name="dosenId" value={profile!.id} />
                <input type="hidden" name="redirectPath" value={redirectPath} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="stageId">Tahap yang Dibahas</Label>
                    <Select
                      id="stageId"
                      name="stageId"
                      required
                      defaultValue={skripsi.current_stage_id ?? ""}
                    >
                      {(stages ?? []).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.urutan}. {s.nama}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tanggal">Tanggal Bimbingan</Label>
                    <Input
                      id="tanggal"
                      name="tanggal"
                      type="date"
                      required
                      defaultValue={new Date().toISOString().slice(0, 10)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="topik">Topik</Label>
                  <Input id="topik" name="topik" required placeholder="Mis. Revisi Bab 3" />
                </div>
                <div>
                  <Label htmlFor="catatanRevisi">Catatan Revisi</Label>
                  <Textarea id="catatanRevisi" name="catatanRevisi" rows={3} />
                </div>
                <Button type="submit">Simpan Catatan Bimbingan</Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
