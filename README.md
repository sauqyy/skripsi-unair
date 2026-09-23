# Monitoring Skripsi

Website monitoring progress skripsi mahasiswa untuk koordinator, dosen pembimbing, dan mahasiswa. Lihat [PLAN.md](./PLAN.md) untuk rancangan lengkap fitur & keputusan produk.

Stack: **Next.js (App Router) + Supabase** (Auth, Postgres, Storage), Tailwind CSS, Resend (email), `@react-pdf/renderer` (ekspor kartu bimbingan).

## 1. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan seluruh isi [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql). Ini akan membuat semua tabel, Row Level Security, trigger, storage bucket, dan seed 5 tahapan skripsi default.
3. Buka **Project Settings → API**, salin:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (rahasia!) → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Environment Variables

Salin `.env.example` ke `.env.local` dan isi:

```bash
cp .env.example .env.local
```

| Variabel | Keterangan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dari Supabase API settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only, dipakai cron & jangan pernah expose ke browser |
| `RESEND_API_KEY` | Dari [resend.com](https://resend.com) — untuk email reminder deadline |
| `RESEND_FROM_EMAIL` | Alamat pengirim, mis. `Monitoring Skripsi <no-reply@domainkamu.com>` |
| `CRON_SECRET` | String acak bebas — dipakai Vercel Cron untuk otorisasi endpoint reminder |

## 3. Seed Akun Koordinator Pertama

Tidak ada halaman untuk mendaftar sebagai koordinator (harus dibuat manual, lihat [PLAN.md](./PLAN.md) bagian 3):

1. Daftar akun biasa lewat `/register` (misal pilih peran "Mahasiswa" sementara) — atau buat user langsung dari **Authentication → Users → Add user** di Supabase Dashboard.
2. Di **SQL Editor**, jalankan:
   ```sql
   update profiles set role = 'koordinator', status = 'active' where email = 'email-koordinator@kampus.ac.id';
   ```
3. Login dengan akun tersebut — akan otomatis diarahkan ke `/koordinator`.

## 4. Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000.

## 5. Alur Pemakaian

1. **Koordinator** login → menu **Verifikasi Akun** untuk approve pendaftaran dosen/mahasiswa baru.
2. Koordinator membuka **Assignment Bimbingan** untuk menetapkan Pembimbing 1 (wajib) & Pembimbing 2 (opsional) tiap mahasiswa.
3. Koordinator mengatur **deadline tiap tahapan** dari halaman detail mahasiswa.
4. **Dosen** mencatat sesi bimbingan (topik + catatan revisi) dan meng-update status tahapan mahasiswa bimbingannya.
5. **Mahasiswa** mengunggah draft PDF, mengajukan bimbingan, dan memantau progress di dashboard-nya.
6. Kartu bimbingan bisa diekspor ke PDF kapan saja dari halaman Bimbingan (mahasiswa) atau detail mahasiswa (dosen).

## 6. Email Reminder Deadline (Cron)

Endpoint `/api/cron/deadline-reminders` mengecek tahapan yang deadline-nya jatuh **H-7, H-3, H-1** dan mengirim email ke mahasiswa (selalu) serta dosen pembimbing (jika `email_reminder_optin` aktif, diatur di halaman Settings dosen).

- **Deploy ke Vercel**: file [`vercel.json`](./vercel.json) sudah berisi jadwal cron harian (01:00 UTC). Vercel otomatis mengirim header `Authorization: Bearer $CRON_SECRET` — cukup set env var `CRON_SECRET` di Vercel project settings.
- **Testing manual lokal**:
  ```bash
  curl -H "Authorization: Bearer <CRON_SECRET_kamu>" http://localhost:3000/api/cron/deadline-reminders
  ```

## 7. Deploy

1. Push ke GitHub, import project ke [Vercel](https://vercel.com).
2. Set semua environment variable di atas pada Vercel project settings.
3. Deploy — cron job di `vercel.json` otomatis aktif.

## 8. Struktur Kode Penting

```
supabase/migrations/0001_init.sql   # schema, RLS, storage bucket, seed data
src/types/database.ts               # tipe TypeScript hasil mirror schema
src/lib/supabase/                   # client.ts (browser), server.ts (RSC/actions), admin.ts (service role)
src/lib/actions/                    # server actions: progress, bimbingan, dokumen
src/lib/pdf/kartu-bimbingan.tsx     # template PDF kartu bimbingan
src/app/(auth)/                     # login, register, pending
src/app/koordinator/                # area koordinator
src/app/dosen/                      # area dosen pembimbing
src/app/mahasiswa/                  # area mahasiswa
src/app/api/cron/deadline-reminders # cron harian pengingat deadline
src/app/api/kartu-bimbingan/[id]    # ekspor kartu bimbingan ke PDF
```
