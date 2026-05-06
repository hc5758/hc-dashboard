-- =============================================
-- HC DASHBOARD 5758 - DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS / ADMIN TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'hr_staff' CHECK (role IN ('super_admin', 'hr_manager', 'hr_staff')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. EMPLOYEES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id TEXT UNIQUE NOT NULL, -- e.g. EMP001
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  position TEXT NOT NULL,
  level TEXT CHECK (level IN ('Director','Head','Sr. Manager','Manager','Jr. Manager','Sr. Specialist','Specialist','Jr. Specialist','Sr. Officer','Officer','Sr. Staff','Staff','Jr. Staff','Associate')),
  division TEXT NOT NULL,
  entity TEXT NOT NULL CHECK (entity IN ('SSR','Nyambee (PAT)','PAT-5758')),
  employment_type TEXT NOT NULL CHECK (employment_type IN ('PKWTT','PKWT')),
  work_location TEXT DEFAULT 'Jakarta',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','resigned','end_contract')),
  gender TEXT CHECK (gender IN ('Laki-laki','Perempuan')),
  birth_date DATE,
  marital_status TEXT CHECK (marital_status IN ('Belum Kawin','Kawin','Cerai')),
  join_date DATE NOT NULL,
  end_date DATE, -- untuk PKWT
  superior_id UUID REFERENCES employees(id),
  bank_name TEXT,
  bank_account TEXT,
  address TEXT,
  emergency_contact TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. CONTRACTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  contract_type TEXT NOT NULL CHECK (contract_type IN ('PKWTT','PKWT','Probasi')),
  contract_number TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. ONBOARDING TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  pic_id UUID REFERENCES admin_users(id),
  quarter TEXT NOT NULL CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  hiring_source TEXT CHECK (hiring_source IN ('Job Portal','LinkedIn','Referral','Internal','Headhunter','Walk-in')),
  placement_location TEXT,
  -- Admin tasks
  update_to_structure BOOLEAN DEFAULT false,
  send_job_description BOOLEAN DEFAULT false,
  -- Onboarding sessions
  session_1 BOOLEAN DEFAULT false,
  session_1_date DATE,
  session_1_notes TEXT,
  session_2 BOOLEAN DEFAULT false,
  session_2_date DATE,
  session_2_notes TEXT,
  session_3 BOOLEAN DEFAULT false,
  session_3_date DATE,
  session_3_notes TEXT,
  session_4 BOOLEAN DEFAULT false,
  session_4_date DATE,
  session_4_notes TEXT,
  -- Status
  is_completed BOOLEAN DEFAULT false,
  completed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. OFFBOARDING / RESIGN TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS offboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  pic_id UUID REFERENCES admin_users(id),
  report_date DATE NOT NULL,
  quarter TEXT NOT NULL CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  offboard_type TEXT NOT NULL CHECK (offboard_type IN ('Resign','End of Contract','Termination','Retirement')),
  effective_date DATE NOT NULL,
  reason_to_leave TEXT,
  -- Checklist
  return_assets BOOLEAN DEFAULT false,
  return_assets_date DATE,
  clearance_letter BOOLEAN DEFAULT false,
  clearance_letter_date DATE,
  exit_interview BOOLEAN DEFAULT false,
  exit_interview_date DATE,
  send_paklaring BOOLEAN DEFAULT false,
  send_paklaring_date DATE,
  bpjs_deactivated BOOLEAN DEFAULT false,
  final_payment_done BOOLEAN DEFAULT false,
  final_payment_date DATE,
  -- BPJS & docs
  bpjs_ketenagakerjaan TEXT,
  bpjs_kesehatan TEXT,
  -- Notes
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. RECRUITMENT PIPELINE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS recruitment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  position TEXT NOT NULL,
  division TEXT NOT NULL,
  entity TEXT NOT NULL CHECK (entity IN ('SSR','Nyambee (PAT)','PAT-5758')),
  pic_id UUID REFERENCES admin_users(id),
  quarter TEXT NOT NULL CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  hiring_source TEXT,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open','In Progress','Offering','Hired','On Hold','Cancelled')),
  -- Candidate counts per stage
  total_applicants INTEGER DEFAULT 0,
  screening_count INTEGER DEFAULT 0,
  interview_count INTEGER DEFAULT 0,
  offering_count INTEGER DEFAULT 0,
  -- Result
  hired_employee_id UUID REFERENCES employees(id),
  hired_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. TNA (Training Needs Analysis) TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tna_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  pic_id UUID REFERENCES admin_users(id),
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  quarter TEXT CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  training_name TEXT NOT NULL,
  training_category TEXT CHECK (training_category IN ('Hard Skill','Soft Skill','Leadership','Technical','Compliance','Others')),
  training_method TEXT CHECK (training_method IN ('Online','Offline','Hybrid','Self-learning')),
  vendor TEXT,
  target_date DATE,
  actual_date DATE,
  duration_hours INTEGER,
  cost BIGINT DEFAULT 0, -- in IDR
  status TEXT NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned','In Progress','Done','Overdue','Cancelled')),
  score INTEGER, -- post-training score 0-100
  certificate_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 8. ACTING / PROMOSI TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  promotion_type TEXT NOT NULL CHECK (promotion_type IN ('Promosi','Acting','Mutasi','Demosi')),
  quarter TEXT CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  old_position TEXT NOT NULL,
  new_position TEXT NOT NULL,
  old_division TEXT,
  new_division TEXT,
  old_level TEXT,
  new_level TEXT,
  effective_date DATE NOT NULL,
  pic_id UUID REFERENCES admin_users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 9. PIP / SP TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS pip_sp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  pic_id UUID REFERENCES admin_users(id),
  type TEXT NOT NULL CHECK (type IN ('SP1','SP2','SP3','PIP')),
  issue_date DATE NOT NULL,
  end_date DATE,
  reason TEXT NOT NULL,
  improvement_plan TEXT,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Completed','Extended','Terminated')),
  result TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 10. SALARY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS salary_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  basic_salary BIGINT NOT NULL DEFAULT 0,
  allowance BIGINT DEFAULT 0,
  overtime BIGINT DEFAULT 0,
  bonus BIGINT DEFAULT 0,
  deduction BIGINT DEFAULT 0,
  bpjs_ketenagakerjaan BIGINT DEFAULT 0,
  bpjs_kesehatan BIGINT DEFAULT 0,
  pph21 BIGINT DEFAULT 0,
  net_salary BIGINT GENERATED ALWAYS AS (
    basic_salary + allowance + overtime + bonus - deduction - bpjs_ketenagakerjaan - bpjs_kesehatan - pph21
  ) STORED,
  payment_date DATE,
  is_paid BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, year, month)
);

-- =============================================
-- 11. ATTENDANCE / CUTI TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS attendance_leave (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('Tahunan','Sakit','Melahirkan','Penting','Cuti Bersama','Unpaid')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'Approved' CHECK (status IN ('Pending','Approved','Rejected')),
  approved_by UUID REFERENCES admin_users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 12. ACTIVITY LOG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES admin_users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_entity ON employees(entity);
CREATE INDEX IF NOT EXISTS idx_employees_division ON employees(division);
CREATE INDEX IF NOT EXISTS idx_contracts_employee ON contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_onboarding_employee ON onboarding(employee_id);
CREATE INDEX IF NOT EXISTS idx_offboarding_employee ON offboarding(employee_id);
CREATE INDEX IF NOT EXISTS idx_tna_employee ON tna_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_tna_status ON tna_records(status);
CREATE INDEX IF NOT EXISTS idx_salary_employee_year ON salary_records(employee_id, year);
CREATE INDEX IF NOT EXISTS idx_leave_employee ON attendance_leave(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_dates ON attendance_leave(start_date, end_date);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE offboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment ENABLE ROW LEVEL SECURITY;
ALTER TABLE tna_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pip_sp ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_leave ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: hanya user yang login bisa baca semua data
CREATE POLICY "Authenticated users can read all" ON employees FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert" ON employees FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON employees FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read all" ON contracts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert" ON contracts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON contracts FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read all" ON onboarding FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert" ON onboarding FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON onboarding FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read all" ON offboarding FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert" ON offboarding FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON offboarding FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read all" ON tna_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert" ON tna_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON tna_records FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read all" ON recruitment FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert" ON recruitment FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON recruitment FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read all" ON promotions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert" ON promotions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON promotions FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read all" ON pip_sp FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert" ON pip_sp FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON pip_sp FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read all" ON salary_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert" ON salary_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON salary_records FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read all" ON attendance_leave FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert" ON attendance_leave FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update" ON attendance_leave FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read all" ON activity_log FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert" ON activity_log FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admin can read own profile" ON admin_users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin can update own profile" ON admin_users FOR UPDATE USING (auth.uid() = id);
