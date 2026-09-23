import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { addDays, format } from "date-fns";

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "yellow" | "red" }) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-sm text-slate-500">{label}</p>
        <p
          className={
            "mt-1 text-3xl font-bold " +
            (tone === "red" ? "text-red-600" : tone === "yellow" ? "text-yellow-600" : "text-slate-900")
          }
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export default async function KoordinatorDashboardPage() {
  const supabase = await createClient();

  const [
    { count: totalMahasiswa },
    { count: totalDosen },
    { count: pendingAccounts },
    { data: stages },
    { data: progressRows },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "mahasiswa").eq("status", "active"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "dosen").eq("status", "active"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("stages").select("*").order("urutan"),
    supabase
      .from("skripsi_progress")
      .select("*, stages(nama, urutan), skripsi(judul, mahasiswa_id, profiles(nama))")
      .neq("status", "selesai")
      .not("deadline", "is", null)
      .lte("deadline", format(addDays(new Date(), 7), "yyyy-MM-dd"))
      .order("deadline", { ascending: true })
      .limit(10),
  ]);

  const stageCounts = new Map<string, number>();
  if (stages) {
    const { data: skripsiList } = await supabase.from("skripsi").select("current_stage_id");
    for (const s of skripsiList ?? []) {
      if (s.current_stage_id) {
        stageCounts.set(s.current_stage_id, (stageCounts.get(s.current_stage_id) ?? 0) + 1);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Dashboard Koordinator</h1>
        <p className="text-sm text-slate-500">Ringkasan progress skripsi seluruh mahasiswa</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Mahasiswa Aktif" value={totalMahasiswa ?? 0} />
        <StatCard label="Dosen Pembimbing" value={totalDosen ?? 0} />
        <StatCard
          label="Akun Menunggu Verifikasi"
          value={pendingAccounts ?? 0}
          tone={pendingAccounts ? "yellow" : undefined}
        />
        <StatCard
          label="Deadline ≤ 7 Hari"
          value={progressRows?.length ?? 0}
          tone={progressRows?.length ? "red" : undefined}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mahasiswa per Tahapan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {(stages ?? []).map((stage) => (
              <div key={stage.id} className="rounded-md border border-slate-100 p-3 text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {stageCounts.get(stage.id) ?? 0}
                </p>
                <p className="mt-1 text-xs text-slate-500">{stage.nama}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deadline Mendekat (≤ 7 hari)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!progressRows || progressRows.length === 0 ? (
            <p className="text-sm text-slate-400">Tidak ada deadline yang mendekat.</p>
          ) : (
            progressRows.map((row) => {
              const skripsi = row.skripsi as unknown as {
                judul: string | null;
                mahasiswa_id: string;
                profiles: { nama: string } | null;
              } | null;
              const stage = row.stages as unknown as { nama: string } | null;
              return (
                <div
                  key={row.id}
                  className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {skripsi?.profiles?.nama ?? "-"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {stage?.nama} · {skripsi?.judul ?? "Judul belum diisi"}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge tone="red">{row.deadline}</Badge>
                    <div>
                      <Link
                        href={`/koordinator/mahasiswa/${skripsi?.mahasiswa_id}`}
                        className="text-xs font-medium text-slate-500 hover:text-slate-900"
                      >
                        Lihat detail →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
