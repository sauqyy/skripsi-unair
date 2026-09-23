import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/get-current-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UploadDocumentForm } from "@/components/upload-document-form";
import { DownloadDocumentButton } from "@/components/download-document-button";
import { deleteDocumentAction } from "@/lib/actions/document-actions";

export default async function MahasiswaDokumenPage() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: skripsi } = await supabase
    .from("skripsi")
    .select("id")
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

  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("skripsi_id", skripsi.id)
    .order("versi", { ascending: false });

  const redirectPath = "/mahasiswa/dokumen";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Dokumen PDF Skripsi</h1>
        <p className="text-sm text-slate-500">
          Unggah draft skripsi kamu. Setiap unggahan tersimpan sebagai versi baru.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unggah Dokumen Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <UploadDocumentForm skripsiId={skripsi.id} redirectPath={redirectPath} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Dokumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(!documents || documents.length === 0) && (
            <p className="text-sm text-slate-400">Belum ada dokumen diunggah.</p>
          )}
          {(documents ?? []).map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {d.nama_file} <Badge tone="slate">v{d.versi}</Badge>
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(d.uploaded_at).toLocaleString("id-ID")}
                </p>
              </div>
              <div className="flex gap-2">
                <DownloadDocumentButton storagePath={d.storage_path} />
                <form action={deleteDocumentAction}>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="storagePath" value={d.storage_path} />
                  <input type="hidden" name="redirectPath" value={redirectPath} />
                  <Button type="submit" size="sm" variant="danger">
                    Hapus
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
