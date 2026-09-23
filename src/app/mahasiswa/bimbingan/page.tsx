import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select } from "@/components/ui/input";
import { Button, LinkButton } from "@/components/ui/button";
import { requestBimbinganAction } from "@/lib/actions/bimbingan-actions";

export default async function MahasiswaBimbinganPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: skripsi } = await supabase
    .from("skripsi")
    .select("id")
    .eq("mahasiswa_id", profile!.id)
    .maybeSingle();

  const { data: assignments } = await supabase
    .from("bimbingan_assignments")
    .select("*, profiles!bimbingan_assignments_dosen_id_fkey(nama)")
    .eq("mahasiswa_id", profile!.id);

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
                  <Label htmlFor="tanggal">Tanggal Diusulkan</Label>
                  <Input id="tanggal" name="tanggal" type="date" required />
                </div>
              </div>

              <div>
                <Label htmlFor="topik">Topik yang Ingin Dibahas</Label>
                <Input id="topik" name="topik" required placeholder="Mis. Diskusi metodologi penelitian" />
              </div>

              <Button type="submit">Ajukan</Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Bimbingan ({bimbinganList?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(!bimbinganList || bimbinganList.length === 0) && (
            <p className="text-sm text-slate-400">Belum ada riwayat bimbingan.</p>
          )}
          {(bimbinganList ?? []).map((b) => {
            const dosen = b.profiles as unknown as { nama: string } | null;
            return (
              <div key={b.id} className="rounded-md border border-slate-100 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">
                    Pertemuan ke-{b.pertemuan_ke} · {b.tanggal}
                  </p>
                  <Badge tone={b.status === "selesai" ? "green" : b.status === "ditolak" ? "red" : "yellow"}>
                    {b.status}
                  </Badge>
                </div>
                <p className="mt-1 text-slate-600">Dosen: {dosen?.nama}</p>
                {b.topik && <p className="mt-1 text-slate-600">Topik: {b.topik}</p>}
                {b.catatan_revisi && (
                  <p className="mt-1 text-slate-600">Catatan revisi: {b.catatan_revisi}</p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
