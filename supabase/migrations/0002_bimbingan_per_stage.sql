-- =====================================================================
-- Link each bimbingan session to the thesis stage it covers, and turn
-- `pertemuan_ke` into a per-stage counter instead of a whole-thesis one.
-- =====================================================================

alter table bimbingan
  add column stage_id uuid references stages (id);

-- Backfill existing rows: best guess is the skripsi's current stage at
-- migration time (fine for dummy/demo data; real deployments will have
-- this column populated correctly from the moment it's added).
update bimbingan b
set stage_id = s.current_stage_id
from skripsi s
where b.skripsi_id = s.id
  and b.stage_id is null
  and s.current_stage_id is not null;

-- Any leftover rows with no resolvable stage fall back to the earliest one
-- so the column can be made required.
update bimbingan b
set stage_id = (select id from stages order by urutan limit 1)
where b.stage_id is null;

alter table bimbingan
  alter column stage_id set not null;

create index idx_bimbingan_stage on bimbingan (skripsi_id, stage_id);

comment on column bimbingan.stage_id is
  'Tahap skripsi yang dibahas pada sesi ini. pertemuan_ke dihitung ulang per (skripsi_id, stage_id), bukan global.';

comment on column bimbingan.pertemuan_ke is
  'Urutan pertemuan UNTUK TAHAP INI SAJA (mis. pertemuan ke-2 untuk tahap Bab 4-5), bukan urutan keseluruhan skripsi.';
