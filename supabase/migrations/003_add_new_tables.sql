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

-- ── ADD NEW ONBOARDING COLUMNS ────────────────────────────
ALTER TABLE onboarding ADD COLUMN IF NOT EXISTS akses              BOOLEAN DEFAULT false;
ALTER TABLE onboarding ADD COLUMN IF NOT EXISTS hc_onboarding      BOOLEAN DEFAULT false;
ALTER TABLE onboarding ADD COLUMN IF NOT EXISTS gnowbe             BOOLEAN DEFAULT false;
ALTER TABLE onboarding ADD COLUMN IF NOT EXISTS perkenalan_tim     BOOLEAN DEFAULT false;
-- Sub perkenalan tim
ALTER TABLE onboarding ADD COLUMN IF NOT EXISTS perk_project       BOOLEAN DEFAULT false;
ALTER TABLE onboarding ADD COLUMN IF NOT EXISTS perk_account       BOOLEAN DEFAULT false;
ALTER TABLE onboarding ADD COLUMN IF NOT EXISTS perk_strategist    BOOLEAN DEFAULT false;
ALTER TABLE onboarding ADD COLUMN IF NOT EXISTS perk_creative      BOOLEAN DEFAULT false;
ALTER TABLE onboarding ADD COLUMN IF NOT EXISTS perk_kom           BOOLEAN DEFAULT false;
ALTER TABLE onboarding ADD COLUMN IF NOT EXISTS perk_data          BOOLEAN DEFAULT false;
ALTER TABLE onboarding ADD COLUMN IF NOT EXISTS perk_finance_bcbs  BOOLEAN DEFAULT false;
ALTER TABLE onboarding ADD COLUMN IF NOT EXISTS perk_community     BOOLEAN DEFAULT false;
ALTER TABLE onboarding ADD COLUMN IF NOT EXISTS perk_sosmed        BOOLEAN DEFAULT false;
-- Probation
ALTER TABLE onboarding ADD COLUMN IF NOT EXISTS probation_plan     BOOLEAN DEFAULT false;
ALTER TABLE onboarding ADD COLUMN IF NOT EXISTS checkin_1          BOOLEAN DEFAULT false;
ALTER TABLE onboarding ADD COLUMN IF NOT EXISTS checkin_2          BOOLEAN DEFAULT false;
ALTER TABLE onboarding ADD COLUMN IF NOT EXISTS checkin_3          BOOLEAN DEFAULT false;
ALTER TABLE onboarding ADD COLUMN IF NOT EXISTS checkin_4          BOOLEAN DEFAULT false;
ALTER TABLE onboarding ADD COLUMN IF NOT EXISTS checkin_5          BOOLEAN DEFAULT false;
ALTER TABLE onboarding ADD COLUMN IF NOT EXISTS final_review       BOOLEAN DEFAULT false;

-- ── LEAVE BALANCE (Saldo Cuti per Karyawan per Tahun) ──────
CREATE TABLE IF NOT EXISTS leave_balance (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  year            INTEGER NOT NULL DEFAULT 2026,
  -- Hak cuti tahunan
  annual_entitled INTEGER NOT NULL DEFAULT 12,   -- hak cuti tahunan (12 hari)
  annual_used     INTEGER NOT NULL DEFAULT 0,    -- sudah dipakai
  annual_carryover INTEGER NOT NULL DEFAULT 0,   -- carry over dari tahun lalu (max 5)
  -- Sakit
  sick_used       INTEGER NOT NULL DEFAULT 0,
  -- Cuti khusus terencana
  birthday_entitled INTEGER NOT NULL DEFAULT 1,
  birthday_used     INTEGER NOT NULL DEFAULT 0,
  married_entitled  INTEGER NOT NULL DEFAULT 3,
  married_used      INTEGER NOT NULL DEFAULT 0,
  child_event_entitled INTEGER NOT NULL DEFAULT 2,
  child_event_used     INTEGER NOT NULL DEFAULT 0,
  -- Cuti khusus tidak terencana
  paternity_entitled INTEGER NOT NULL DEFAULT 2,
  paternity_used     INTEGER NOT NULL DEFAULT 0,
  bereavement_entitled INTEGER NOT NULL DEFAULT 2,
  bereavement_used     INTEGER NOT NULL DEFAULT 0,
  -- Overtime / kompensasi
  overtime_entitled INTEGER NOT NULL DEFAULT 0,   -- ditambah manual oleh HC
  overtime_used     INTEGER NOT NULL DEFAULT 0,
  -- Notes
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, year)
);
CREATE INDEX IF NOT EXISTS idx_leave_bal_emp ON leave_balance(employee_id, year);
ALTER TABLE leave_balance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_only_leave_balance" ON leave_balance;
CREATE POLICY "service_role_only_leave_balance" ON leave_balance USING (true);

-- Tambah kolom leave_balance_id di attendance_leave
ALTER TABLE attendance_leave ADD COLUMN IF NOT EXISTS balance_id UUID REFERENCES leave_balance(id);
ALTER TABLE attendance_leave ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT 2026;
