import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { KartuBimbinganDocument } from "@/lib/pdf/kartu-bimbingan";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ skripsiId: string }> }
) {
  const { skripsiId } = await params;
  const supabase = await createClient();

  // RLS makes each of these queries return nothing if the caller (mahasiswa
  // who doesn't own this skripsi, or dosen who doesn't supervise it) isn't
  // allowed to see it — so a null/empty result here doubles as an auth check.
  const { data: skripsi } = await supabase
    .from("skripsi")
    .select("*, profiles!skripsi_mahasiswa_id_fkey(nama, nim_nip, prodi)")
    .eq("id", skripsiId)
    .maybeSingle();

  if (!skripsi) {
    return NextResponse.json({ error: "Tidak ditemukan atau tidak diizinkan." }, { status: 404 });
  }

  const [{ data: assignments }, { data: bimbinganList }, { data: stages }] = await Promise.all([
    supabase
      .from("bimbingan_assignments")
      .select("*, profiles!bimbingan_assignments_dosen_id_fkey(nama)")
      .eq("mahasiswa_id", skripsi.mahasiswa_id),
    supabase
      .from("bimbingan")
      .select("*, profiles!bimbingan_dosen_id_fkey(nama)")
      .eq("skripsi_id", skripsiId)
      .order("pertemuan_ke", { ascending: true }),
    supabase.from("stages").select("*").order("urutan"),
  ]);

  const mahasiswa = skripsi.profiles as unknown as {
    nama: string;
    nim_nip: string;
    prodi: string;
  } | null;

  const pembimbing = (assignments ?? []).map((a) => ({
    ke: a.pembimbing_ke,
    nama: (a.profiles as unknown as { nama: string } | null)?.nama ?? "-",
  }));

  const stageById = new Map((stages ?? []).map((s) => [s.id, s]));

  const riwayat = (bimbinganList ?? [])
    .map((b) => ({
      tahap: stageById.get(b.stage_id)?.nama ?? "-",
      tahapUrutan: stageById.get(b.stage_id)?.urutan ?? 0,
      pertemuanKe: b.pertemuan_ke,
      tanggal: b.tanggal,
      dosen: (b.profiles as unknown as { nama: string } | null)?.nama ?? "-",
      topik: b.topik ?? "-",
      catatanRevisi: b.catatan_revisi ?? "-",
    }))
    .sort((a, b) => a.tahapUrutan - b.tahapUrutan || a.pertemuanKe - b.pertemuanKe);

  const buffer = await renderToBuffer(
    <KartuBimbinganDocument
      mahasiswaNama={mahasiswa?.nama ?? "-"}
      nimNip={mahasiswa?.nim_nip ?? "-"}
      prodi={mahasiswa?.prodi ?? "-"}
      judul={skripsi.judul ?? "Belum diisi"}
      pembimbing={pembimbing}
      riwayat={riwayat}
    />
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="kartu-bimbingan-${mahasiswa?.nim_nip ?? skripsiId}.pdf"`,
    },
  });
}
