import { createClient } from "@/lib/supabase/server";
import { getProgressRows } from "@/lib/get-progress-rows";
import { ProgressTracker } from "@/components/progress-tracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";

export default async function KoordinatorMahasiswaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: mahasiswa } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .eq("role", "mahasiswa")
    .single();

  if (!mahasiswa) notFound();

  const { data: skripsi } = await supabase
    .from("skripsi")
    .select("*")
    .eq("mahasiswa_id", id)
    .maybeSingle();

  const [{ data: assignments }, { data: bimbinganList }] = await Promise.all([
    supabase
      .from("bimbingan_assignments")
      .select("*, profiles!bimbingan_assignments_dosen_id_fkey(nama)")
      .eq("mahasiswa_id", id),
    skripsi
      ? supabase
          .from("bimbingan")
          .select("*, profiles!bimbingan_dosen_id_fkey(nama)")
          .eq("skripsi_id", skripsi.id)
          .order("pertemuan_ke", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
  ]);

  const progressRows = skripsi ? await getProgressRows(skripsi.id) : [];
  const redirectPath = `/koordinator/mahasiswa/${id}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{mahasiswa.nama}</h1>
        <p className="text-sm text-slate-500">
          {mahasiswa.nim_nip} · {mahasiswa.prodi} · {mahasiswa.email}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pembimbing</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {(assignments ?? []).length === 0 && (
            <p className="text-sm text-slate-400">Belum ada dosen pembimbing.</p>
          )}
          {(assignments ?? []).map((a) => {
            const dosen = a.profiles as unknown as { nama: string } | null;
            return (
              <Badge key={a.id} tone="blue">
                Pembimbing {a.pembimbing_ke}: {dosen?.nama}
              </Badge>
            );
          })}
        </CardContent>
      </Card>

      {!skripsi ? (
        <Card>
          <CardContent className="py-6 text-center text-sm text-slate-400">
            Mahasiswa belum memiliki data skripsi (belum di-assign ke dosen pembimbing).
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
              <CardTitle>Progress Tahapan &amp; Deadline</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressTracker
                skripsiId={skripsi.id}
                rows={progressRows}
                editableDeadline
                editableStatus={false}
                redirectPath={redirectPath}
              />
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
        </>
      )}
    </div>
  );
}
