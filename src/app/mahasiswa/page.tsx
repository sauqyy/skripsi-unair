import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { getProgressRows } from "@/lib/get-progress-rows";
import { ProgressTracker } from "@/components/progress-tracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function MahasiswaDashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: skripsi } = await supabase
    .from("skripsi")
    .select("*, stages(nama)")
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
          Kamu belum di-assign ke dosen pembimbing oleh koordinator. Hubungi
          koordinator program studi.
        </CardContent>
      </Card>
    );
  }

  const { count: totalBimbinganSelesai } = await supabase
    .from("bimbingan")
    .select("id", { count: "exact", head: true })
    .eq("skripsi_id", skripsi.id)
    .eq("status", "selesai");

  const progressRows = await getProgressRows(skripsi.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          Halo, {profile!.nama.split(" ")[0]}
        </h1>
        <p className="text-sm text-slate-500">
          {skripsi.judul ?? "Judul skripsi belum diisi"} · Tahap sekarang: {skripsi.stages?.nama ?? "-"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="py-5">
            <p className="text-sm text-slate-500">Total Bimbingan Selesai</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{totalBimbinganSelesai ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 space-y-1">
            <p className="text-sm text-slate-500">Pembimbing</p>
            {(assignments ?? []).map((a) => {
              const dosen = a.profiles as unknown as { nama: string } | null;
              return (
                <Badge key={a.id} tone="blue" className="mr-1">
                  P{a.pembimbing_ke}: {dosen?.nama}
                </Badge>
              );
            })}
            {(!assignments || assignments.length === 0) && (
              <p className="text-sm text-slate-400">Belum ada pembimbing.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress Skripsi</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressTracker
            skripsiId={skripsi.id}
            rows={progressRows}
            editableDeadline={false}
            editableStatus={false}
            redirectPath="/mahasiswa"
          />
        </CardContent>
      </Card>
    </div>
  );
}
