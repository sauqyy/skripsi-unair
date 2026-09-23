import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createStageAction, deleteStageAction } from "./actions";

export default async function TahapanPage() {
  const supabase = await createClient();
  const { data: stages } = await supabase.from("stages").select("*").order("urutan");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Master Tahapan Skripsi</h1>
        <p className="text-sm text-slate-500">
          Urutan tahapan ini dipakai untuk melacak progress semua mahasiswa.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Tahapan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(stages ?? []).map((stage) => (
            <div
              key={stage.id}
              className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {stage.urutan}. {stage.nama}
                </p>
                {stage.deskripsi && (
                  <p className="text-xs text-slate-500">{stage.deskripsi}</p>
                )}
              </div>
              <form action={deleteStageAction}>
                <input type="hidden" name="id" value={stage.id} />
                <Button size="sm" variant="danger" type="submit">
                  Hapus
                </Button>
              </form>
            </div>
          ))}
          {(!stages || stages.length === 0) && (
            <p className="text-sm text-slate-400">Belum ada tahapan.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tambah Tahapan</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createStageAction} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Label htmlFor="nama">Nama Tahapan</Label>
                <Input id="nama" name="nama" required />
              </div>
              <div>
                <Label htmlFor="urutan">Urutan</Label>
                <Input id="urutan" name="urutan" type="number" min={1} required />
              </div>
            </div>
            <div>
              <Label htmlFor="deskripsi">Deskripsi (opsional)</Label>
              <Textarea id="deskripsi" name="deskripsi" rows={2} />
            </div>
            <Button type="submit">Tambah Tahapan</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
