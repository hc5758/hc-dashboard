-- ══════════════════════════════════════════════════════════
-- Jalankan HANYA file ini di Supabase SQL Editor
-- Jangan jalankan 001_schema.sql lagi dari awal!
-- ══════════════════════════════════════════════════════════

-- 1. Tabel recruitment_candidates (kandidat per posisi)
CREATE TABLE IF NOT EXISTS recruitment_candidates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruitment_id  UUID NOT NULL REFERENCES recruitment(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  source          TEXT,
  stage           TEXT NOT NULL DEFAULT 'Applicant'
                  CHECK (stage IN ('Applicant','Screening','Interview','Offering','Hired','Rejected')),
  interview_date  DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cand_rec ON recruitment_candidates(recruitment_id);
ALTER TABLE recruitment_candidates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_only_recruitment_candidates" ON recruitment_candidates;
CREATE POLICY "service_role_only_recruitment_candidates" ON recruitment_candidates USING (true);

-- 2. Tabel performance_scores (score PE per orang per tahun)
CREATE TABLE IF NOT EXISTS performance_scores (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  year          INTEGER NOT NULL,
  quarter       TEXT CHECK (quarter IN ('Q1','Q2','Q3','Q4','Full Year')),
  score         NUMERIC(5,1) NOT NULL CHECK (score BETWEEN 0 AND 100),
  csat_score    TEXT,
  kpi_score     TEXT,
  csat_link     TEXT,
  kpi_link      TEXT,
  pic_name      TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, year, quarter)
);
CREATE INDEX IF NOT EXISTS idx_perf_emp ON performance_scores(employee_id, year);
ALTER TABLE performance_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_only_performance_scores" ON performance_scores;
CREATE POLICY "service_role_only_performance_scores" ON performance_scores USING (true);

-- 3. Kolom baru di tabel recruitment
ALTER TABLE recruitment ADD COLUMN IF NOT EXISTS hiring_process      TEXT DEFAULT 'Open';
ALTER TABLE recruitment ADD COLUMN IF NOT EXISTS on_progress_hiring  TEXT;
ALTER TABLE recruitment ADD COLUMN IF NOT EXISTS ol_signed_date      DATE;
ALTER TABLE recruitment ADD COLUMN IF NOT EXISTS join_date           DATE;
ALTER TABLE recruitment ADD COLUMN IF NOT EXISTS request_date        DATE;
ALTER TABLE recruitment ADD COLUMN IF NOT EXISTS budget_allocation   NUMERIC(15,0) DEFAULT 0;
ALTER TABLE recruitment ADD COLUMN IF NOT EXISTS remarks             TEXT;

-- Selesai ✓
SELECT 'Migration berhasil!' AS status;
