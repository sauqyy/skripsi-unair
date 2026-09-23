import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default async function DosenMahasiswaListPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from("bimbingan_assignments")
    .select(
      "*, profiles!bimbingan_assignments_mahasiswa_id_fkey(id, nama, nim_nip, prodi, skripsi(judul, status, stages(nama)))"
    )
    .eq("dosen_id", profile!.id)
    .order("pembimbing_ke");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Mahasiswa Bimbingan</h1>
        <p className="text-sm text-slate-500">Daftar mahasiswa yang kamu bimbing.</p>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Peran</th>
                <th className="px-4 py-3">Judul</th>
                <th className="px-4 py-3">Tahap</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {(assignments ?? []).map((a) => {
                const mhs = a.profiles as unknown as {
                  id: string;
                  nama: string;
                  nim_nip: string;
                  prodi: string;
                  skripsi: { judul: string | null; status: string; stages: { nama: string } | null } | null;
                } | null;
                return (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{mhs?.nama}</p>
                      <p className="text-xs text-slate-500">{mhs?.nim_nip} · {mhs?.prodi}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">Pembimbing {a.pembimbing_ke}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {mhs?.skripsi?.judul ?? <span className="text-slate-400">Belum diisi</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {mhs?.skripsi?.stages?.nama ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dosen/mahasiswa/${mhs?.id}`}
                        className="text-sm font-medium text-slate-900 underline"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {(!assignments || assignments.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-400">
                    Belum ada mahasiswa bimbingan.
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
