import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { setAssignmentAction } from "./actions";
import { AutoSubmitSelect } from "@/components/auto-submit-select";
import type { BimbinganAssignment } from "@/types/database";

export default async function AssignmentPage() {
  const supabase = await createClient();

  const [{ data: mahasiswaList }, { data: dosenList }, { data: assignments }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("role", "mahasiswa")
        .eq("status", "active")
        .order("nama"),
      supabase
        .from("profiles")
        .select("*")
        .eq("role", "dosen")
        .eq("status", "active")
        .order("nama"),
      supabase.from("bimbingan_assignments").select("*"),
    ]);

  const assignmentMap = new Map<string, BimbinganAssignment>();
  for (const a of assignments ?? []) {
    assignmentMap.set(`${a.mahasiswa_id}-${a.pembimbing_ke}`, a);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Assignment Bimbingan</h1>
        <p className="text-sm text-slate-500">
          Tetapkan Pembimbing 1 (wajib) dan Pembimbing 2 (opsional) untuk tiap mahasiswa.
        </p>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Mahasiswa</th>
                <th className="px-4 py-3">Pembimbing 1</th>
                <th className="px-4 py-3">Pembimbing 2</th>
              </tr>
            </thead>
            <tbody>
              {(mahasiswaList ?? []).map((mhs) => {
                const p1 = assignmentMap.get(`${mhs.id}-1`);
                const p2 = assignmentMap.get(`${mhs.id}-2`);
                return (
                  <tr key={mhs.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{mhs.nama}</p>
                      <p className="text-xs text-slate-500">{mhs.nim_nip}</p>
                    </td>
                    <td className="px-4 py-3">
                      <form action={setAssignmentAction}>
                        <input type="hidden" name="mahasiswaId" value={mhs.id} />
                        <input type="hidden" name="pembimbingKe" value="1" />
                        <AutoSubmitSelect name="dosenId" defaultValue={p1?.dosen_id ?? ""}>
                          <option value="">— Pilih dosen —</option>
                          {(dosenList ?? []).map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.nama}
                            </option>
                          ))}
                        </AutoSubmitSelect>
                      </form>
                    </td>
                    <td className="px-4 py-3">
                      <form action={setAssignmentAction}>
                        <input type="hidden" name="mahasiswaId" value={mhs.id} />
                        <input type="hidden" name="pembimbingKe" value="2" />
                        <AutoSubmitSelect name="dosenId" defaultValue={p2?.dosen_id ?? ""}>
                          <option value="">— Tidak ada —</option>
                          {(dosenList ?? []).map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.nama}
                            </option>
                          ))}
                        </AutoSubmitSelect>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {(!mahasiswaList || mahasiswaList.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-sm text-slate-400">
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
