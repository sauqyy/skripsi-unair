import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { decideAccountAction } from "./actions";

export default async function VerifikasiAkunPage() {
  const supabase = await createClient();

  const { data: pending } = await supabase
    .from("profiles")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const { data: recent } = await supabase
    .from("profiles")
    .select("*")
    .neq("status", "pending")
    .neq("role", "koordinator")
    .order("created_at", { ascending: false })
    .limit(15);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Verifikasi Akun</h1>
        <p className="text-sm text-slate-500">
          Setujui atau tolak pendaftaran akun dosen &amp; mahasiswa baru.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Menunggu Persetujuan ({pending?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!pending || pending.length === 0 ? (
            <p className="text-sm text-slate-400">Tidak ada pendaftaran baru.</p>
          ) : (
            pending.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-md border border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {p.nama}{" "}
                    <Badge tone="blue" className="ml-1">
                      {p.role}
                    </Badge>
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.email} · {p.nim_nip} · {p.prodi}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={decideAccountAction}>
                    <input type="hidden" name="profileId" value={p.id} />
                    <input type="hidden" name="decision" value="active" />
                    <Button size="sm" variant="primary" type="submit">
                      Setujui
                    </Button>
                  </form>
                  <form action={decideAccountAction}>
                    <input type="hidden" name="profileId" value={p.id} />
                    <input type="hidden" name="decision" value="rejected" />
                    <Button size="sm" variant="danger" type="submit">
                      Tolak
                    </Button>
                  </form>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Keputusan Terbaru</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!recent || recent.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada riwayat.</p>
          ) : (
            recent.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-1 text-sm">
                <span className="text-slate-700">
                  {p.nama} <span className="text-slate-400">({p.role})</span>
                </span>
                <Badge tone={p.status === "active" ? "green" : "red"}>{p.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
