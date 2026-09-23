"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/** Mahasiswa mengajukan sesi bimbingan baru (status: diajukan). */
const requestSchema = z.object({
  skripsiId: z.string().uuid(),
  topik: z.string().min(3),
  tanggal: z.string(),
  dosenId: z.string().uuid(),
  redirectPath: z.string(),
});

export async function requestBimbinganAction(formData: FormData) {
  const parsed = requestSchema.parse({
    skripsiId: formData.get("skripsiId"),
    topik: formData.get("topik"),
    tanggal: formData.get("tanggal"),
    dosenId: formData.get("dosenId"),
    redirectPath: formData.get("redirectPath"),
  });

  const supabase = await createClient();

  const { count } = await supabase
    .from("bimbingan")
    .select("id", { count: "exact", head: true })
    .eq("skripsi_id", parsed.skripsiId);

  const { error } = await supabase.from("bimbingan").insert({
    skripsi_id: parsed.skripsiId,
    dosen_id: parsed.dosenId,
    pertemuan_ke: (count ?? 0) + 1,
    tanggal: parsed.tanggal,
    topik: parsed.topik,
    status: "diajukan",
  });

  if (error) throw new Error(error.message);

  await supabase.from("notifications").insert({
    user_id: parsed.dosenId,
    pesan: `Ada pengajuan bimbingan baru untuk tanggal ${parsed.tanggal}.`,
    tipe: "bimbingan",
  });

  revalidatePath(parsed.redirectPath);
}

/** Dosen mengisi catatan revisi & menyelesaikan (atau menolak) sesi bimbingan. */
const completeSchema = z.object({
  bimbinganId: z.string().uuid(),
  mahasiswaId: z.string().uuid(),
  catatanRevisi: z.string().optional(),
  status: z.enum(["selesai", "ditolak"]),
  redirectPath: z.string(),
});

export async function completeBimbinganAction(formData: FormData) {
  const parsed = completeSchema.parse({
    bimbinganId: formData.get("bimbinganId"),
    mahasiswaId: formData.get("mahasiswaId"),
    catatanRevisi: formData.get("catatanRevisi") || undefined,
    status: formData.get("status"),
    redirectPath: formData.get("redirectPath"),
  });

  const supabase = await createClient();

  const { error } = await supabase
    .from("bimbingan")
    .update({
      catatan_revisi: parsed.catatanRevisi,
      status: parsed.status,
    })
    .eq("id", parsed.bimbinganId);

  if (error) throw new Error(error.message);

  await supabase.from("notifications").insert({
    user_id: parsed.mahasiswaId,
    pesan:
      parsed.status === "selesai"
        ? "Sesi bimbingan kamu telah diisi catatan revisi oleh dosen."
        : "Pengajuan bimbingan kamu ditolak oleh dosen.",
    tipe: "bimbingan",
  });

  revalidatePath(parsed.redirectPath);
}

/** Dosen langsung mencatat sesi bimbingan yang sudah terjadi (offline). */
const logSchema = z.object({
  skripsiId: z.string().uuid(),
  mahasiswaId: z.string().uuid(),
  dosenId: z.string().uuid(),
  tanggal: z.string(),
  topik: z.string().min(3),
  catatanRevisi: z.string().optional(),
  redirectPath: z.string(),
});

export async function logBimbinganAction(formData: FormData) {
  const parsed = logSchema.parse({
    skripsiId: formData.get("skripsiId"),
    mahasiswaId: formData.get("mahasiswaId"),
    dosenId: formData.get("dosenId"),
    tanggal: formData.get("tanggal"),
    topik: formData.get("topik"),
    catatanRevisi: formData.get("catatanRevisi") || undefined,
    redirectPath: formData.get("redirectPath"),
  });

  const supabase = await createClient();

  const { count } = await supabase
    .from("bimbingan")
    .select("id", { count: "exact", head: true })
    .eq("skripsi_id", parsed.skripsiId);

  const { error } = await supabase.from("bimbingan").insert({
    skripsi_id: parsed.skripsiId,
    dosen_id: parsed.dosenId,
    pertemuan_ke: (count ?? 0) + 1,
    tanggal: parsed.tanggal,
    topik: parsed.topik,
    catatan_revisi: parsed.catatanRevisi,
    status: "selesai",
  });

  if (error) throw new Error(error.message);

  await supabase.from("notifications").insert({
    user_id: parsed.mahasiswaId,
    pesan: `Dosen mencatat sesi bimbingan baru (${parsed.tanggal}).`,
    tipe: "bimbingan",
  });

  revalidatePath(parsed.redirectPath);
}
