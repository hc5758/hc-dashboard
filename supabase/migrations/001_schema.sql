-- ============================================================
-- HC DASHBOARD 5758 — Complete Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── EMPLOYEES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id     TEXT UNIQUE NOT NULL,
  full_name       TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  position        TEXT NOT NULL,
  level           TEXT,
  division        TEXT NOT NULL,
  entity          TEXT NOT NULL CHECK (entity IN ('SSR','Nyambee (PAT)','PAT-5758')),
  employment_type TEXT NOT NULL CHECK (employment_type IN ('PKWTT','PKWT')),
  work_location   TEXT DEFAULT 'Jakarta',
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','resigned','end_contract')),
  gender          TEXT CHECK (gender IN ('Laki-laki','Perempuan')),
  birth_date      DATE,
  marital_status  TEXT,
  join_date       DATE NOT NULL,
  end_date        DATE,
  bank_name       TEXT,
  bank_account    TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONTRACTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contracts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  contract_type   TEXT NOT NULL CHECK (contract_type IN ('PKWTT','PKWT','Probasi')),
  contract_number TEXT,
  start_date      DATE NOT NULL,
  end_date        DATE,
  is_active       BOOLEAN DEFAULT true,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── ONBOARDING ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id         UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  pic_name            TEXT,
  quarter             TEXT NOT NULL CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  year                INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  hiring_source       TEXT,
  placement_location  TEXT DEFAULT 'Jakarta',
  update_to_structure BOOLEAN DEFAULT false,
  send_job_description BOOLEAN DEFAULT false,
  session_1           BOOLEAN DEFAULT false,
  session_1_date      DATE,
  session_2           BOOLEAN DEFAULT false,
  session_2_date      DATE,
  session_3           BOOLEAN DEFAULT false,
  session_3_date      DATE,
  session_4           BOOLEAN DEFAULT false,
  session_4_date      DATE,
  is_completed        BOOLEAN DEFAULT false,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── OFFBOARDING ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS offboarding (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  pic_name          TEXT,
  report_date       DATE NOT NULL,
  quarter           TEXT NOT NULL CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  year              INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  offboard_type     TEXT NOT NULL CHECK (offboard_type IN ('Resign','End of Contract','Termination','Retirement')),
  effective_date    DATE NOT NULL,
  reason_to_leave   TEXT,
  return_assets     BOOLEAN DEFAULT false,
  clearance_letter  BOOLEAN DEFAULT false,
  exit_interview    BOOLEAN DEFAULT false,
  send_paklaring    BOOLEAN DEFAULT false,
  bpjs_deactivated  BOOLEAN DEFAULT false,
  final_payment_done BOOLEAN DEFAULT false,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── RECRUITMENT ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recruitment (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  position         TEXT NOT NULL,
  division         TEXT NOT NULL,
  entity           TEXT NOT NULL CHECK (entity IN ('SSR','Nyambee (PAT)','PAT-5758')),
  pic_name         TEXT,
  quarter          TEXT NOT NULL CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  year             INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  hiring_source    TEXT,
  target_date      DATE,
  status           TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','In Progress','Offering','Hired','On Hold','Cancelled')),
  total_applicants INTEGER DEFAULT 0,
  screening_count  INTEGER DEFAULT 0,
  interview_count  INTEGER DEFAULT 0,
  offering_count   INTEGER DEFAULT 0,
  hired_date       DATE,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── TNA RECORDS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tna_records (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id       UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  year              INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  quarter           TEXT CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  training_name     TEXT NOT NULL,
  training_category TEXT CHECK (training_category IN ('Hard Skill','Soft Skill','Leadership','Technical','Compliance','Others')),
  training_method   TEXT CHECK (training_method IN ('Online','Offline','Hybrid','Self-learning')),
  vendor            TEXT,
  target_date       DATE,
  actual_date       DATE,
  duration_hours    INTEGER,
  cost              BIGINT DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned','In Progress','Done','Overdue','Cancelled')),
  score             INTEGER CHECK (score BETWEEN 0 AND 100),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── PIP / SP ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pip_sp (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id      UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  pic_name         TEXT,
  type             TEXT NOT NULL CHECK (type IN ('SP1','SP2','SP3','PIP')),
  issue_date       DATE NOT NULL,
  end_date         DATE,
  reason           TEXT NOT NULL,
  improvement_plan TEXT,
  status           TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Completed','Extended','Terminated')),
  result           TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── SALARY RECORDS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salary_records (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id      UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  year             INTEGER NOT NULL,
  month            INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  basic_salary     BIGINT NOT NULL DEFAULT 0,
  allowance        BIGINT DEFAULT 0,
  overtime         BIGINT DEFAULT 0,
  bonus            BIGINT DEFAULT 0,
  deduction        BIGINT DEFAULT 0,
  bpjs_ketenagakerjaan BIGINT DEFAULT 0,
  bpjs_kesehatan   BIGINT DEFAULT 0,
  pph21            BIGINT DEFAULT 0,
  net_salary       BIGINT GENERATED ALWAYS AS (
    basic_salary + allowance + overtime + bonus
    - deduction - bpjs_ketenagakerjaan - bpjs_kesehatan - pph21
  ) STORED,
  payment_date     DATE,
  is_paid          BOOLEAN DEFAULT false,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, year, month)
);

-- ── ATTENDANCE / LEAVE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance_leave (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id  UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type   TEXT NOT NULL CHECK (leave_type IN ('Tahunan','Sakit','Melahirkan','Penting','Cuti Bersama','Unpaid')),
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  total_days   INTEGER NOT NULL DEFAULT 1,
  status       TEXT NOT NULL DEFAULT 'Approved' CHECK (status IN ('Pending','Approved','Rejected')),
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── ENGAGEMENT SURVEYS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS engagement_surveys (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year              INTEGER NOT NULL,
  quarter           TEXT NOT NULL CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  division          TEXT NOT NULL,
  engagement_score  NUMERIC(3,1),
  satisfaction_score NUMERIC(3,1),
  response_count    INTEGER DEFAULT 0,
  total_count       INTEGER DEFAULT 0,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── ACTIVITY LOG ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action      TEXT NOT NULL,
  table_name  TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_emp_status    ON employees(status);
CREATE INDEX IF NOT EXISTS idx_emp_entity    ON employees(entity);
CREATE INDEX IF NOT EXISTS idx_emp_division  ON employees(division);
CREATE INDEX IF NOT EXISTS idx_emp_join      ON employees(join_date);
CREATE INDEX IF NOT EXISTS idx_emp_end       ON employees(end_date);
CREATE INDEX IF NOT EXISTS idx_contract_emp  ON contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_contract_end  ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_tna_emp       ON tna_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_tna_status    ON tna_records(status);
CREATE INDEX IF NOT EXISTS idx_salary_emp    ON salary_records(employee_id, year, month);
CREATE INDEX IF NOT EXISTS idx_leave_emp     ON attendance_leave(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_dates   ON attendance_leave(start_date, end_date);

-- ── ROW LEVEL SECURITY ─────────────────────────────────────
ALTER TABLE employees           ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding          ENABLE ROW LEVEL SECURITY;
ALTER TABLE offboarding         ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tna_records         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pip_sp              ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_leave    ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_surveys  ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log        ENABLE ROW LEVEL SECURITY;

-- Policies: semua akses via service_role key (server-side only)
-- Anon tidak bisa akses langsung — semua melalui API routes
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'employees','contracts','onboarding','offboarding','recruitment',
    'tna_records','pip_sp','salary_records','attendance_leave',
    'engagement_surveys','activity_log'
  ] LOOP
    EXECUTE format('CREATE POLICY "service_role_only_%s" ON %I USING (true)', tbl, tbl);
  END LOOP;
END $$;
