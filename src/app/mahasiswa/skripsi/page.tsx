import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateSkripsiAction } from "./actions";

export default async function MahasiswaSkripsiPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: skripsi } = await supabase
    .from("skripsi")
    .select("*")
    .eq("mahasiswa_id", profile!.id)
    .maybeSingle();

  if (!skripsi) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-slate-500">
          Data skripsi belum tersedia. Hubungi koordinator.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Data Skripsi</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Judul &amp; Abstrak</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateSkripsiAction} className="space-y-4">
            <div>
              <Label htmlFor="judul">Judul Skripsi</Label>
              <Input id="judul" name="judul" defaultValue={skripsi.judul ?? ""} required />
            </div>
            <div>
              <Label htmlFor="abstrak">Abstrak</Label>
              <Textarea id="abstrak" name="abstrak" rows={6} defaultValue={skripsi.abstrak ?? ""} />
            </div>
            <Button type="submit">Simpan</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
