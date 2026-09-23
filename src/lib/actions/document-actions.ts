"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const uploadSchema = z.object({
  skripsiId: z.string().uuid(),
  redirectPath: z.string(),
});

export interface UploadDocumentState {
  error?: string;
}

export async function uploadDocumentAction(
  _prevState: UploadDocumentState,
  formData: FormData
): Promise<UploadDocumentState> {
  const parsed = uploadSchema.parse({
    skripsiId: formData.get("skripsiId"),
    redirectPath: formData.get("redirectPath"),
  });

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Pilih file PDF terlebih dahulu." };
  }
  if (file.type !== "application/pdf") {
    return { error: "File harus berformat PDF." };
  }
  if (file.size > 20 * 1024 * 1024) {
    return { error: "Ukuran file maksimal 20MB." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi berakhir, silakan login kembali." };

  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("skripsi_id", parsed.skripsiId);

  const versi = (count ?? 0) + 1;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${user.id}/v${versi}-${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("skripsi-documents")
    .upload(storagePath, file, { contentType: "application/pdf" });

  if (uploadError) return { error: uploadError.message };

  const { error: insertError } = await supabase.from("documents").insert({
    skripsi_id: parsed.skripsiId,
    nama_file: file.name,
    storage_path: storagePath,
    versi,
  });

  if (insertError) return { error: insertError.message };

  revalidatePath(parsed.redirectPath);
  return {};
}

export async function getDocumentDownloadUrl(storagePath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("skripsi-documents")
    .createSignedUrl(storagePath, 60 * 5); // 5 minutes

  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function deleteDocumentAction(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const storagePath = z.string().parse(formData.get("storagePath"));
  const redirectPath = z.string().parse(formData.get("redirectPath"));

  const supabase = await createClient();

  await supabase.storage.from("skripsi-documents").remove([storagePath]);
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(redirectPath);
}
