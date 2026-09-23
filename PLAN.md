# Plan Website Monitoring Progress Skripsi

> Dokumen perencanaan. Belum ada kode yang ditulis. Tujuan: monitoring progress skripsi mahasiswa oleh dosen pembimbing dan koordinator.

## 1. Ringkasan & Keputusan Awal

| Keputusan | Pilihan |
|-----------|---------|
| Tech stack | **Next.js (App Router) + Supabase** (Auth, Postgres, Storage) |
| Tujuan | Dipakai beneran di lingkungan kampus |
| Manajemen akun | User daftar sendiri → diverifikasi/approve oleh koordinator |
| Pembimbing per mahasiswa | 1 atau 2 dosen (Pembimbing 1 & Pembimbing 2) |
| Kartu bimbingan | Sementara **offline**, tanpa tanda tangan/approval digital |
| Notifikasi | **Email** untuk reminder deadline tugas skripsi yang mendekat |
| Deployment | Vercel (web) + Supabase (backend), keduanya punya free tier |

**Alasan stack:** satu bahasa (TypeScript) untuk frontend & backend, Supabase menyediakan authentication, database Postgres, dan file storage (untuk PDF) dalam satu paket — sangat cocok untuk fitur upload PDF + role management tanpa harus membangun server sendiri.

---

## 2. Peran & Hak Akses (Roles)

### Koordinator (Admin)
- Akses ke **semua** data.
- Approve / tolak pendaftaran akun dosen & mahasiswa.
- Assign mahasiswa ke dosen pembimbing (dan bisa mengubah).
- Kelola master data tahapan skripsi (misal: Proposal, Bab 1–3, Seminar, dst).
- Lihat progress semua mahasiswa & rekap statistik.
- Kelola periode/tahun akademik.

### Dosen Pembimbing
- Lihat daftar mahasiswa bimbingannya saja.
- Lihat progress & dokumen (PDF) tiap mahasiswanya.
- Buat/isi catatan bimbingan: apa yang direvisi, saran, status.
- Setujui (approve) kenaikan tahap skripsi mahasiswa.
- Verifikasi jumlah bimbingan (untuk syarat sidang, dll).

### Mahasiswa
- Lihat progress skripsinya sendiri (di tahap mana).
- Upload PDF draft skripsi (berversi).
- Ajukan/lihat jadwal & riwayat bimbingan.
- Lihat catatan revisi dari dosen.
- Lihat berapa kali sudah bimbingan.

---

## 3. Alur Pendaftaran & Verifikasi Akun

1. User membuka halaman **Register**, memilih peran (Dosen / Mahasiswa), mengisi data (nama, email, NIM/NIP, prodi, dll).
2. Akun dibuat dengan status **`pending`** — belum bisa mengakses dashboard.
3. Koordinator melihat daftar pendaftaran di panel **"Verifikasi Akun"**.
4. Koordinator **approve** (status → `active`) atau **reject** (status → `rejected`).
5. Setelah aktif, koordinator meng-**assign** mahasiswa ke dosen pembimbing. Satu mahasiswa bisa punya **1 atau 2 pembimbing** (Pembimbing 1 & Pembimbing 2).
6. User yang sudah aktif bisa login dan masuk ke dashboard sesuai perannya.

> Koordinator pertama dibuat manual (seed) langsung di database, karena tidak ada yang meng-approve koordinator.

---

## 4. Struktur Data (Database Schema)

Tabel utama (Postgres via Supabase):

- **profiles** — `id` (ref auth user), `nama`, `email`, `role` (koordinator/dosen/mahasiswa), `status` (pending/active/rejected), `nim_nip`, `prodi`, `email_reminder_optin` (bool, default true — dipakai dosen di halaman Settings), `created_at`.
- **bimbingan_assignments** — `id`, `dosen_id`, `mahasiswa_id`, `pembimbing_ke` (1 atau 2), `periode`. Satu mahasiswa bisa punya sampai 2 baris (Pembimbing 1 & 2); satu dosen memegang banyak mahasiswa.
- **skripsi** — `id`, `mahasiswa_id`, `judul`, `abstrak`, `current_stage_id`, `status` (aktif/selesai/cuti), `deadline_akhir` (target selesai/sidang, opsional), `created_at`.
- **stages** (master tahapan) — `id`, `nama`, `urutan`, `deskripsi`. Contoh: Pengajuan Judul → Proposal → Seminar Proposal → Bimbingan Bab 4–5 → Sidang.
- **skripsi_progress** — `id`, `skripsi_id`, `stage_id`, `status` (belum/proses/selesai/disetujui), `tanggal_mulai`, `deadline` (target tahap ini selesai), `tanggal_selesai`, `approved_by`. **Field `deadline` inilah yang dipakai untuk reminder email.**
- **bimbingan** (sesi konsultasi) — `id`, `skripsi_id`, `dosen_id`, `pertemuan_ke`, `tanggal`, `topik`, `catatan_revisi`, `status` (diajukan/selesai), `created_at`.
- **documents** — `id`, `skripsi_id`, `bimbingan_id` (opsional), `nama_file`, `storage_path`, `versi`, `uploaded_at`. File fisik disimpan di **Supabase Storage** (bucket privat).
- **notifications** — `id`, `user_id`, `pesan`, `tipe` (deadline/bimbingan/sistem), `dibaca`, `created_at`.
- **email_reminders_log** — `id`, `skripsi_progress_id`, `dikirim_ke`, `tanggal_kirim`, `jenis` (H-7/H-3/H-1). Mencegah email dobel untuk deadline yang sama.

**Keamanan data:** pakai **Row Level Security (RLS)** Supabase supaya dosen hanya bisa membaca data mahasiswa bimbingannya, mahasiswa hanya datanya sendiri, koordinator semua.

---

## 5. Daftar Halaman (Screens)

**Umum / Auth**
- Landing / Login
- Register (pilih peran)
- Halaman "menunggu verifikasi"

**Koordinator**
- Dashboard (statistik: jumlah mahasiswa per tahap, progress lambat, dll)
- Verifikasi Akun (approve/reject)
- Kelola Assignment (mahasiswa ↔ dosen, Pembimbing 1 & 2)
- Daftar semua mahasiswa + detail progress
- Kelola master Tahapan
- **Atur deadline tiap tahap** per mahasiswa
- Rekap / laporan

**Dosen**
- Dashboard (ringkasan mahasiswa bimbingan)
- Daftar mahasiswa bimbingan
- Detail mahasiswa: progress, dokumen PDF, riwayat bimbingan
- Form isi catatan bimbingan / revisi
- Approve kenaikan tahap
- **Ekspor kartu bimbingan mahasiswa ke PDF**
- **Settings** — tombol on/off untuk menerima email reminder deadline

**Mahasiswa**
- Dashboard (progress bar tahapan, ringkasan + deadline tiap tahap)
- Detail skripsi (judul, tahap sekarang)
- Upload / kelola dokumen PDF (berversi)
- Riwayat bimbingan & catatan revisi
- **Ekspor kartu bimbingan ke PDF** (arsip)
- Ajukan bimbingan

---

## 5b. Notifikasi Email Deadline

Tujuan: mengingatkan mahasiswa (dan opsional dosen pembimbingnya) saat tugas/tahap skripsi mendekati **deadline**.

**Cara kerja:**
1. **Deadline tiap tahap ditetapkan oleh KOORDINATOR** di `skripsi_progress.deadline` (mahasiswa & dosen tidak mengubahnya).
2. Sebuah **scheduled job** (Vercel Cron atau Supabase Edge Function terjadwal) berjalan **sekali sehari**.
3. Job mengecek tahap yang statusnya belum selesai dan deadline-nya jatuh pada **H-7, H-3, dan H-1**.
4. Kirim email via layanan email transaksional (mis. **Resend** — gratis untuk volume kecil) berisi nama mahasiswa, tahap, dan tanggal deadline.
5. **Penerima:** mahasiswa yang bersangkutan **selalu** dapat email. **Dosen pembimbingnya** hanya dapat email jika `email_reminder_optin = true` (diatur sendiri di halaman **Settings** — ada tombol on/off).
6. Catat di `email_reminders_log` agar tidak mengirim email dobel; juga buat entri di `notifications` (in-app).

**Yang perlu disiapkan:** akun layanan email (Resend/SMTP kampus), domain pengirim, dan template email.

---

## 5c. Ekspor Kartu Bimbingan ke PDF

Meski bimbingan dijalankan offline, sistem tetap menyimpan riwayatnya dan bisa **mencetak kartu bimbingan** untuk arsip.

- Kartu berisi: identitas mahasiswa, dosen pembimbing (1 & 2), judul skripsi, lalu tabel riwayat bimbingan (pertemuan ke-, tanggal, topik, catatan revisi).
- Bisa diekspor oleh **mahasiswa** (kartunya sendiri) dan **dosen** (kartu mahasiswa bimbingannya).
- Dibuat server-side dari data `bimbingan` menjadi file PDF (mis. library `@react-pdf/renderer` atau `pdfkit`), lalu diunduh.
- Karena tanda tangan offline, kartu menyediakan kolom tanda tangan kosong untuk ditandatangani manual setelah dicetak.

---

## 6. Arsitektur Teknis

- **Frontend & Backend:** Next.js App Router (React Server Components + Route Handlers / Server Actions).
- **Auth:** Supabase Auth (email/password), disimpan di cookie/session.
- **Database:** Supabase Postgres + Row Level Security per role.
- **File storage:** Supabase Storage (bucket privat, akses lewat signed URL).
- **UI:** Tailwind CSS + komponen (mis. shadcn/ui) untuk mempercepat.
- **Validasi:** Zod untuk validasi form/input.
- **Email:** Resend (atau SMTP) untuk reminder deadline.
- **Scheduled job:** Vercel Cron / Supabase Edge Function (cek deadline harian).
- **PDF:** `@react-pdf/renderer` / `pdfkit` untuk ekspor kartu bimbingan.
- **Deployment:** Vercel (frontend) + Supabase (managed backend).

---

## 7. Tahapan Pengembangan (Milestones)

**Fase 0 — Setup**
- Inisialisasi project Next.js + Tailwind, koneksi ke Supabase, struktur folder.

**Fase 1 — Auth & Role**
- Register, login, status pending, proteksi halaman berdasarkan role.

**Fase 2 — Koordinator core**
- Verifikasi akun, assignment mahasiswa–dosen, master tahapan.

**Fase 3 — Skripsi & Progress**
- Data skripsi mahasiswa, tampilan progress bar tahapan, update tahap.

**Fase 4 — Bimbingan**
- Ajukan bimbingan, isi catatan/revisi oleh dosen, riwayat & hitungan bimbingan.

**Fase 5 — Upload Dokumen**
- Upload PDF ke Supabase Storage, versioning, download via signed URL.

**Fase 6 — Dashboard, Notifikasi & Email Deadline**
- Statistik koordinator, notifikasi in-app, scheduled job + email reminder deadline (H-7/H-3/H-1), polish UI.

**Fase 7 — Keamanan & Deploy**
- Finalisasi RLS, testing per role, deploy ke Vercel + Supabase, setup domain email.

---

## 8. Keputusan yang Sudah Difinalisasi

- ✅ 1 mahasiswa bisa punya **1 atau 2 pembimbing** (Pembimbing 1 & 2) — dimodelkan lewat `pembimbing_ke` di `bimbingan_assignments`.
- ✅ Kartu bimbingan **offline**, **tanpa** tanda tangan/approval digital — tidak ada fitur e-signature di sistem.
- ✅ Notifikasi **email** khusus untuk **reminder deadline** tugas skripsi (H-7/H-3/H-1) — butuh field `deadline` + scheduled job + layanan email.
- ✅ **Deadline tiap tahap ditetapkan oleh koordinator**.
- ✅ **Dosen bisa memilih** menerima email reminder atau tidak lewat halaman **Settings** (`email_reminder_optin`). Mahasiswa selalu menerima.
- ✅ **Ekspor kartu bimbingan ke PDF** disediakan (arsip), dengan kolom tanda tangan kosong untuk ditandatangani manual (offline).

## 9. Hal yang Masih Bisa Diputuskan Nanti

- Layanan email pengirim final (Resend vs SMTP kampus) & domain pengirim.
- Daftar tahapan skripsi yang pasti sesuai aturan prodi/kampus.
