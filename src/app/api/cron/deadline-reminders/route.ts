import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { addDays, format } from "date-fns";
import type { ReminderKind } from "@/types/database";

export const dynamic = "force-dynamic";

const REMINDER_OFFSETS: { days: number; jenis: ReminderKind }[] = [
  { days: 7, jenis: "h7" },
  { days: 3, jenis: "h3" },
  { days: 1, jenis: "h1" },
];

/**
 * Runs once a day (Vercel Cron). For each stage whose deadline is exactly
 * 7, 3, or 1 day(s) away and not yet finished, emails the mahasiswa (always)
 * and the dosen pembimbing (only if email_reminder_optin = true), then logs
 * what was sent so the same reminder is never emailed twice.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  const results: { sent: number; skipped: number; errors: string[] } = {
    sent: 0,
    skipped: 0,
    errors: [],
  };

  for (const { days, jenis } of REMINDER_OFFSETS) {
    const targetDate = format(addDays(new Date(), days), "yyyy-MM-dd");

    const { data: rows, error } = await supabase
      .from("skripsi_progress")
      .select(
        "*, stages(nama), skripsi(id, judul, mahasiswa_id, profiles!skripsi_mahasiswa_id_fkey(id, nama, email))"
      )
      .neq("status", "selesai")
      .neq("status", "disetujui")
      .eq("deadline", targetDate);

    if (error) {
      results.errors.push(error.message);
      continue;
    }

    for (const row of rows ?? []) {
      const skripsi = row.skripsi as unknown as {
        id: string;
        judul: string | null;
        mahasiswa_id: string;
        profiles: { id: string; nama: string; email: string } | null;
      } | null;
      const stage = row.stages as unknown as { nama: string } | null;
      if (!skripsi?.profiles) continue;

      const { data: assignments } = await supabase
        .from("bimbingan_assignments")
        .select("*, profiles!bimbingan_assignments_dosen_id_fkey(id, nama, email, email_reminder_optin)")
        .eq("mahasiswa_id", skripsi.mahasiswa_id);

      const recipients: { id: string; nama: string; email: string }[] = [
        { id: skripsi.profiles.id, nama: skripsi.profiles.nama, email: skripsi.profiles.email },
      ];

      for (const a of assignments ?? []) {
        const dosen = a.profiles as unknown as {
          id: string;
          nama: string;
          email: string;
          email_reminder_optin: boolean;
        } | null;
        if (dosen?.email_reminder_optin) {
          recipients.push({ id: dosen.id, nama: dosen.nama, email: dosen.email });
        }
      }

      for (const recipient of recipients) {
        const { data: existingLog } = await supabase
          .from("email_reminders_log")
          .select("id")
          .eq("skripsi_progress_id", row.id)
          .eq("dikirim_ke", recipient.email)
          .eq("jenis", jenis)
          .maybeSingle();

        if (existingLog) {
          results.skipped += 1;
          continue;
        }

        const subject = `Pengingat Deadline: ${stage?.nama} (H-${days})`;
        const body = `Halo ${recipient.nama},\n\nTahap "${stage?.nama}" untuk skripsi "${
          skripsi.judul ?? "(judul belum diisi)"
        }" memiliki deadline pada ${row.deadline} (${days} hari lagi).\n\nSilakan buka Monitoring Skripsi untuk detail lebih lanjut.`;

        try {
          if (resend) {
            await resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL ?? "Monitoring Skripsi <no-reply@example.com>",
              to: recipient.email,
              subject,
              text: body,
            });
          }

          await supabase.from("email_reminders_log").insert({
            skripsi_progress_id: row.id,
            dikirim_ke: recipient.email,
            jenis,
          });

          await supabase.from("notifications").insert({
            user_id: recipient.id,
            pesan: `Deadline "${stage?.nama}" tinggal ${days} hari lagi (${row.deadline}).`,
            tipe: "deadline",
          });

          results.sent += 1;
        } catch (e) {
          results.errors.push(e instanceof Error ? e.message : "Unknown email error");
        }
      }
    }
  }

  return NextResponse.json(results);
}
