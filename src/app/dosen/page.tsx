import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { format, addDays } from "date-fns";

export default async function DosenDashboardPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from("bimbingan_assignments")
    .select("*, profiles!bimbingan_assignments_mahasiswa_id_fkey(id, nama, nim_nip)")
    .eq("dosen_id", profile!.id);

  const mahasiswaIds = (assignments ?? []).map((a) => a.mahasiswa_id);

  const { data: pendingRequests } = mahasiswaIds.length
    ? await supabase
        .from("bimbingan")
        .select("*, skripsi(mahasiswa_id, profiles(nama))")
        .eq("dosen_id", profile!.id)
        .eq("status", "diajukan")
        .order("tanggal")
    : { data: [] };

  const { data: nearDeadlines } = mahasiswaIds.length
    ? await supabase
        .from("skripsi_progress")
        .select("*, stages(nama), skripsi!inner(judul, mahasiswa_id, profiles(nama))")
        .in("skripsi.mahasiswa_id", mahasiswaIds)
        .neq("status", "selesai")
        .not("deadline", "is", null)
        .lte("deadline", format(addDays(new Date(), 7), "yyyy-MM-dd"))
        .order("deadline")
    : { data: [] };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Dashboard Dosen</h1>
        <p className="text-sm text-slate-500">
          Kamu membimbing {assignments?.length ?? 0} mahasiswa.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="py-5">
            <p className="text-sm text-slate-500">Pengajuan Bimbingan Menunggu</p>
            <p className="mt-1 text-3xl font-bold text-yellow-600">
              {pendingRequests?.length ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5">
            <p className="text-sm text-slate-500">Deadline Mahasiswa ≤ 7 Hari</p>
            <p className="mt-1 text-3xl font-bold text-red-600">
              {nearDeadlines?.length ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-3 py-5">
          <h2 className="text-sm font-semibold text-slate-900">Pengajuan Bimbingan Terbaru</h2>
          {(!pendingRequests || pendingRequests.length === 0) && (
            <p className="text-sm text-slate-400">Tidak ada pengajuan menunggu.</p>
          )}
          {(pendingRequests ?? []).map((r) => {
            const skripsi = r.skripsi as unknown as {
              mahasiswa_id: string;
              profiles: { nama: string } | null;
            } | null;
            return (
              <div key={r.id} className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{skripsi?.profiles?.nama}</p>
                  <p className="text-xs text-slate-500">{r.tanggal} · {r.topik}</p>
                </div>
                <Link
                  href={`/dosen/mahasiswa/${skripsi?.mahasiswa_id}`}
                  className="text-xs font-medium text-slate-900 underline"
                >
                  Tindak lanjuti →
                </Link>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
