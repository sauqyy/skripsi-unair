-- =====================================================================
-- Fix: mahasiswa could read their own bimbingan_assignments rows, but not
-- the embedded `profiles` (nama, email) of the dosen those rows point to —
-- RLS on `profiles` silently nulled out the join, so "Pembimbing" badges and
-- the "Ajukan Bimbingan" dosen dropdown rendered with no name.
-- =====================================================================

create policy "profiles: mahasiswa reads own pembimbing" on profiles
  for select using (
    exists (
      select 1 from bimbingan_assignments
      where dosen_id = profiles.id and mahasiswa_id = auth.uid()
    )
  );
