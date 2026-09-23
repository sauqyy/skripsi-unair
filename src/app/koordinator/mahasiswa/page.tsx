import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function KoordinatorMahasiswaListPage() {
  const supabase = await createClient();

  const { data: mahasiswaList } = await supabase
    .from("profiles")
    .select("*, skripsi(judul, status, current_stage_id, stages(nama))")
    .eq("role", "mahasiswa")
    .eq("status", "active")
    .order("nama");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Daftar Mahasiswa</h1>
        <p className="text-sm text-slate-500">Semua mahasiswa aktif dan progress skripsinya.</p>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Judul Skripsi</th>
                <th className="px-4 py-3">Tahap Sekarang</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(mahasiswaList ?? []).map((mhs) => {
                const skripsi = Array.isArray(mhs.skripsi) ? mhs.skripsi[0] : mhs.skripsi;
                return (
                  <tr key={mhs.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{mhs.nama}</p>
                      <p className="text-xs text-slate-500">{mhs.nim_nip} · {mhs.prodi}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {skripsi?.judul ?? <span className="text-slate-400">Belum diisi</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {skripsi?.stages?.nama ?? <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={skripsi?.status === "selesai" ? "green" : "blue"}>
                        {skripsi?.status ?? "belum mulai"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/koordinator/mahasiswa/${mhs.id}`}
                        className="text-sm font-medium text-slate-900 underline"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {(!mahasiswaList || mahasiswaList.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-400">
                    Belum ada mahasiswa aktif.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
