-- =====================================================================
-- Monitoring Skripsi — initial schema
-- Roles: koordinator, dosen, mahasiswa
-- =====================================================================

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type user_role as enum ('koordinator', 'dosen', 'mahasiswa');
create type account_status as enum ('pending', 'active', 'rejected');
create type skripsi_status as enum ('aktif', 'selesai', 'cuti');
create type progress_status as enum ('belum', 'proses', 'selesai', 'disetujui');
create type bimbingan_status as enum ('diajukan', 'selesai', 'ditolak');
create type pembimbing_slot as enum ('1', '2');
create type notification_type as enum ('deadline', 'bimbingan', 'sistem');
create type reminder_kind as enum ('h7', 'h3', 'h1');

-- ---------------------------------------------------------------------
-- profiles — one row per auth user, extends auth.users
-- ---------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nama text not null,
  email text not null,
  role user_role not null,
  status account_status not null default 'pending',
  nim_nip text,
  prodi text,
  email_reminder_optin boolean not null default true,
  created_at timestamptz not null default now()
);

comment on column profiles.email_reminder_optin is
  'Dosen-only setting: whether this user receives deadline reminder emails. Mahasiswa always receive them regardless of this flag.';

-- Auto-create a profile row (status=pending) whenever someone signs up.
-- Role/nama/nim_nip/prodi are passed in from the register form via
-- supabase.auth.signUp({ options: { data: { ... } } }).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nama, email, role, nim_nip, prodi, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama', new.email),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'mahasiswa'),
    new.raw_user_meta_data->>'nim_nip',
    new.raw_user_meta_data->>'prodi',
    'pending'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- stages — master tahapan skripsi (dikelola koordinator)
-- ---------------------------------------------------------------------
create table stages (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  urutan int not null,
  deskripsi text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- bimbingan_assignments — mahasiswa <-> dosen (1 or 2 pembimbing)
-- ---------------------------------------------------------------------
create table bimbingan_assignments (
  id uuid primary key default gen_random_uuid(),
  dosen_id uuid not null references profiles (id) on delete cascade,
  mahasiswa_id uuid not null references profiles (id) on delete cascade,
  pembimbing_ke pembimbing_slot not null default '1',
  periode text,
  created_at timestamptz not null default now(),
  unique (mahasiswa_id, pembimbing_ke)
);

create index idx_assignments_dosen on bimbingan_assignments (dosen_id);
create index idx_assignments_mahasiswa on bimbingan_assignments (mahasiswa_id);

-- ---------------------------------------------------------------------
-- skripsi — 1 row per mahasiswa's thesis
-- ---------------------------------------------------------------------
create table skripsi (
  id uuid primary key default gen_random_uuid(),
  mahasiswa_id uuid not null unique references profiles (id) on delete cascade,
  judul text,
  abstrak text,
  current_stage_id uuid references stages (id),
  status skripsi_status not null default 'aktif',
  deadline_akhir date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- skripsi_progress — per-stage progress + deadline (set by koordinator)
-- ---------------------------------------------------------------------
create table skripsi_progress (
  id uuid primary key default gen_random_uuid(),
  skripsi_id uuid not null references skripsi (id) on delete cascade,
  stage_id uuid not null references stages (id) on delete cascade,
  status progress_status not null default 'belum',
  tanggal_mulai date,
  deadline date,
  tanggal_selesai date,
  approved_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  unique (skripsi_id, stage_id)
);

create index idx_progress_skripsi on skripsi_progress (skripsi_id);
create index idx_progress_deadline on skripsi_progress (deadline) where status <> 'selesai';

-- ---------------------------------------------------------------------
-- bimbingan — consultation sessions / log
-- ---------------------------------------------------------------------
create table bimbingan (
  id uuid primary key default gen_random_uuid(),
  skripsi_id uuid not null references skripsi (id) on delete cascade,
  dosen_id uuid not null references profiles (id),
  pertemuan_ke int not null,
  tanggal date not null default current_date,
  topik text,
  catatan_revisi text,
  status bimbingan_status not null default 'diajukan',
  created_at timestamptz not null default now()
);

create index idx_bimbingan_skripsi on bimbingan (skripsi_id);

-- ---------------------------------------------------------------------
-- documents — uploaded PDF drafts (files live in Supabase Storage)
-- ---------------------------------------------------------------------
create table documents (
  id uuid primary key default gen_random_uuid(),
  skripsi_id uuid not null references skripsi (id) on delete cascade,
  bimbingan_id uuid references bimbingan (id) on delete set null,
  nama_file text not null,
  storage_path text not null,
  versi int not null default 1,
  uploaded_at timestamptz not null default now()
);

create index idx_documents_skripsi on documents (skripsi_id);

-- ---------------------------------------------------------------------
-- notifications — in-app notifications
-- ---------------------------------------------------------------------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  pesan text not null,
  tipe notification_type not null default 'sistem',
  dibaca boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on notifications (user_id, dibaca);

-- ---------------------------------------------------------------------
-- email_reminders_log — dedupe log for deadline reminder emails
-- ---------------------------------------------------------------------
create table email_reminders_log (
  id uuid primary key default gen_random_uuid(),
  skripsi_progress_id uuid not null references skripsi_progress (id) on delete cascade,
  dikirim_ke text not null,
  jenis reminder_kind not null,
  tanggal_kirim timestamptz not null default now(),
  unique (skripsi_progress_id, dikirim_ke, jenis)
);

-- =====================================================================
-- Helper functions (used inside RLS policies)
-- =====================================================================

create function public.current_role()
returns user_role
language sql stable security definer set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create function public.is_koordinator()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'koordinator' and status = 'active'
  );
$$;

create function public.is_active()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and status = 'active'
  );
$$;

-- True if the given mahasiswa_id is supervised by the current (dosen) user.
create function public.supervises(target_mahasiswa_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from bimbingan_assignments
    where mahasiswa_id = target_mahasiswa_id and dosen_id = auth.uid()
  );
$$;

-- Resolve a skripsi_id to its owning mahasiswa_id (used by child-table policies).
create function public.skripsi_owner(target_skripsi_id uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select mahasiswa_id from skripsi where id = target_skripsi_id;
$$;

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table profiles enable row level security;
alter table stages enable row level security;
alter table bimbingan_assignments enable row level security;
alter table skripsi enable row level security;
alter table skripsi_progress enable row level security;
alter table bimbingan enable row level security;
alter table documents enable row level security;
alter table notifications enable row level security;
alter table email_reminders_log enable row level security;

-- ---- profiles ----
create policy "profiles: self read" on profiles
  for select using (id = auth.uid());

create policy "profiles: koordinator reads all" on profiles
  for select using (public.is_koordinator());

create policy "profiles: dosen reads their mahasiswa" on profiles
  for select using (public.supervises(id));

-- Mahasiswa/dosen can edit their own profile fields (nama, prodi, reminder
-- opt-in, etc.) but cannot promote themselves or flip their own status from
-- pending/rejected to active — both must still match what's already stored.
create policy "profiles: self update own row (not role/status)" on profiles
  for update using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select p.role from profiles p where p.id = auth.uid())
    and status = (select p.status from profiles p where p.id = auth.uid())
  );

create policy "profiles: koordinator updates all" on profiles
  for update using (public.is_koordinator());

-- ---- stages ----
create policy "stages: any active user reads" on stages
  for select using (public.is_active());

create policy "stages: koordinator writes" on stages
  for insert with check (public.is_koordinator());
create policy "stages: koordinator updates" on stages
  for update using (public.is_koordinator());
create policy "stages: koordinator deletes" on stages
  for delete using (public.is_koordinator());

-- ---- bimbingan_assignments ----
create policy "assignments: koordinator full access" on bimbingan_assignments
  for all using (public.is_koordinator()) with check (public.is_koordinator());

create policy "assignments: dosen reads own" on bimbingan_assignments
  for select using (dosen_id = auth.uid());

create policy "assignments: mahasiswa reads own" on bimbingan_assignments
  for select using (mahasiswa_id = auth.uid());

-- ---- skripsi ----
create policy "skripsi: koordinator full access" on skripsi
  for all using (public.is_koordinator()) with check (public.is_koordinator());

create policy "skripsi: mahasiswa reads own" on skripsi
  for select using (mahasiswa_id = auth.uid());

create policy "skripsi: mahasiswa updates own (judul/abstrak)" on skripsi
  for update using (mahasiswa_id = auth.uid())
  with check (mahasiswa_id = auth.uid());

create policy "skripsi: dosen reads supervised" on skripsi
  for select using (public.supervises(mahasiswa_id));

-- ---- skripsi_progress ----
create policy "progress: koordinator full access" on skripsi_progress
  for all using (public.is_koordinator()) with check (public.is_koordinator());

create policy "progress: mahasiswa reads own" on skripsi_progress
  for select using (public.skripsi_owner(skripsi_id) = auth.uid());

create policy "progress: dosen reads supervised" on skripsi_progress
  for select using (public.supervises(public.skripsi_owner(skripsi_id)));

create policy "progress: dosen updates status/approval for supervised" on skripsi_progress
  for update using (public.supervises(public.skripsi_owner(skripsi_id)))
  with check (public.supervises(public.skripsi_owner(skripsi_id)));

-- ---- bimbingan ----
create policy "bimbingan: koordinator full access" on bimbingan
  for all using (public.is_koordinator()) with check (public.is_koordinator());

create policy "bimbingan: mahasiswa reads own" on bimbingan
  for select using (public.skripsi_owner(skripsi_id) = auth.uid());

create policy "bimbingan: mahasiswa creates request (diajukan) on own skripsi" on bimbingan
  for insert with check (
    public.skripsi_owner(skripsi_id) = auth.uid()
    and status = 'diajukan'
  );

create policy "bimbingan: dosen reads own sessions" on bimbingan
  for select using (dosen_id = auth.uid());

create policy "bimbingan: dosen manages own sessions" on bimbingan
  for update using (dosen_id = auth.uid())
  with check (dosen_id = auth.uid());

create policy "bimbingan: dosen creates for supervised mahasiswa" on bimbingan
  for insert with check (
    dosen_id = auth.uid()
    and public.supervises(public.skripsi_owner(skripsi_id))
  );

-- ---- documents ----
create policy "documents: koordinator full access" on documents
  for all using (public.is_koordinator()) with check (public.is_koordinator());

create policy "documents: mahasiswa manages own" on documents
  for all using (public.skripsi_owner(skripsi_id) = auth.uid())
  with check (public.skripsi_owner(skripsi_id) = auth.uid());

create policy "documents: dosen reads supervised" on documents
  for select using (public.supervises(public.skripsi_owner(skripsi_id)));

-- ---- notifications ----
create policy "notifications: self read" on notifications
  for select using (user_id = auth.uid());

create policy "notifications: self update (mark read)" on notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "notifications: koordinator full access" on notifications
  for all using (public.is_koordinator()) with check (public.is_koordinator());

-- email_reminders_log has no client-facing policies: only the service-role
-- (cron route, RLS-bypassing) writes/reads it.

-- =====================================================================
-- Storage bucket for skripsi PDF documents (private)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('skripsi-documents', 'skripsi-documents', false)
on conflict (id) do nothing;

-- Path convention enforced by the app: `${mahasiswa_id}/${filename}`
-- so policies can check the first path segment against auth.uid()/supervision.
create policy "storage: mahasiswa manages own folder" on storage.objects
  for all using (
    bucket_id = 'skripsi-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'skripsi-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "storage: dosen reads supervised mahasiswa folder" on storage.objects
  for select using (
    bucket_id = 'skripsi-documents'
    and public.supervises(((storage.foldername(name))[1])::uuid)
  );

create policy "storage: koordinator full access" on storage.objects
  for all using (bucket_id = 'skripsi-documents' and public.is_koordinator())
  with check (bucket_id = 'skripsi-documents' and public.is_koordinator());

-- =====================================================================
-- Seed: default tahapan skripsi (koordinator can edit later)
-- =====================================================================
insert into stages (nama, urutan, deskripsi) values
  ('Pengajuan Judul', 1, 'Mahasiswa mengajukan judul/topik skripsi'),
  ('Proposal', 2, 'Penyusunan proposal skripsi'),
  ('Seminar Proposal', 3, 'Presentasi & revisi proposal'),
  ('Bimbingan Bab 4-5', 4, 'Penelitian, hasil, dan pembahasan'),
  ('Sidang Akhir', 5, 'Sidang skripsi dan revisi akhir');
