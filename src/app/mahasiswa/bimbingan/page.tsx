import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Button, LinkButton } from "@/components/ui/button";
import { requestBimbinganAction } from "@/lib/actions/bimbingan-actions";
import { BimbinganHistoryByStage, type BimbinganEntry } from "@/components/bimbingan-history";

export default async function MahasiswaBimbinganPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: skripsi } = await supabase
    .from("skripsi")
    .select("id, current_stage_id")
    .eq("mahasiswa_id", profile!.id)
    .maybeSingle();

  const [{ data: assignments }, { data: stages }] = await Promise.all([
    supabase
      .from("bimbingan_assignments")
      .select("*, profiles!bimbingan_assignments_dosen_id_fkey(nama)")
      .eq("mahasiswa_id", profile!.id),
    supabase.from("stages").select("*").order("urutan"),
  ]);

  if (!skripsi) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-slate-500">
          Data skripsi belum tersedia. Hubungi koordinator.
        </CardContent>
      </Card>
    );
  }

  const { data: bimbinganList } = await supabase
    .from("bimbingan")
    .select("*, profiles!bimbingan_dosen_id_fkey(nama)")
    .eq("skripsi_id", skripsi.id)
    .order("pertemuan_ke", { ascending: false });

  const totalSelesai = (bimbinganList ?? []).filter((b) => b.status === "selesai").length;
  const redirectPath = "/mahasiswa/bimbingan";

  const entries: BimbinganEntry[] = (bimbinganList ?? []).map((b) => ({
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
          <h1 className="text-lg font-semibold text-slate-900">Bimbingan</h1>
          <p className="text-sm text-slate-500">Total bimbingan selesai: {totalSelesai}</p>
        </div>
        <LinkButton href={`/api/kartu-bimbingan/${skripsi.id}`} variant="secondary">
          Ekspor Kartu Bimbingan (PDF)
        </LinkButton>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ajukan Bimbingan Baru</CardTitle>
        </CardHeader>
        <CardContent>
          {(!assignments || assignments.length === 0) ? (
            <p className="text-sm text-slate-400">Belum ada dosen pembimbing.</p>
          ) : (
            <form action={requestBimbinganAction} className="space-y-4">
              <input type="hidden" name="skripsiId" value={skripsi.id} />
              <input type="hidden" name="redirectPath" value={redirectPath} />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="dosenId">Dosen Pembimbing</Label>
                  <Select id="dosenId" name="dosenId" required>
                    {assignments.map((a) => {
                      const dosen = a.profiles as unknown as { nama: string } | null;
                      return (
                        <option key={a.id} value={a.dosen_id}>
                          Pembimbing {a.pembimbing_ke} — {dosen?.nama}
                        </option>
                      );
                    })}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="stageId">Tahap yang Dibahas</Label>
                  <Select id="stageId" name="stageId" required defaultValue={skripsi.current_stage_id ?? ""}>
                    {(stages ?? []).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.urutan}. {s.nama}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="tanggal">Tanggal Diusulkan</Label>
                  <Input id="tanggal" name="tanggal" type="date" required />
                </div>
                <div>
                  <Label htmlFor="topik">Topik yang Ingin Dibahas</Label>
                  <Input id="topik" name="topik" required placeholder="Mis. Diskusi metodologi penelitian" />
                </div>
              </div>

              <Button type="submit">Ajukan</Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Bimbingan per Tahap</CardTitle>
        </CardHeader>
        <CardContent>
          <BimbinganHistoryByStage stages={stages ?? []} entries={entries} />
        </CardContent>
      </Card>
    </div>
  );
}
