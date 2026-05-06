export type Entity = 'SSR' | 'Nyambee (PAT)' | 'PAT-5758'
export type EmploymentType = 'PKWTT' | 'PKWT'
export type EmployeeStatus = 'active' | 'inactive' | 'resigned' | 'end_contract'
export type Gender = 'Laki-laki' | 'Perempuan'
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'
export type TNAStatus = 'Planned' | 'In Progress' | 'Done' | 'Overdue' | 'Cancelled'
export type RecruitmentStatus = 'Open' | 'In Progress' | 'Offering' | 'Hired' | 'On Hold' | 'Cancelled'
export type LeaveType = 'Tahunan' | 'Sakit' | 'Melahirkan' | 'Penting' | 'Cuti Bersama' | 'Unpaid'
export type PIPType = 'SP1' | 'SP2' | 'SP3' | 'PIP'

export interface Employee {
  id: string
  employee_id: string
  full_name: string
  email?: string
  phone?: string
  position: string
  level?: string
  division: string
  entity: Entity
  employment_type: EmploymentType
  work_location?: string
  status: EmployeeStatus
  gender?: Gender
  birth_date?: string
  marital_status?: string
  join_date: string
  end_date?: string
  bank_name?: string
  bank_account?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Contract {
  id: string
  employee_id: string
  contract_type: 'PKWTT' | 'PKWT' | 'Probasi'
  contract_number?: string
  start_date: string
  end_date?: string
  is_active: boolean
  notes?: string
  created_at: string
  employee?: Employee
}

export interface Onboarding {
  id: string
  employee_id: string
  pic_name?: string
  quarter: Quarter
  year: number
  hiring_source?: string
  placement_location?: string
  update_to_structure: boolean
  send_job_description: boolean
  session_1: boolean
  session_1_date?: string
  session_2: boolean
  session_2_date?: string
  session_3: boolean
  session_3_date?: string
  session_4: boolean
  session_4_date?: string
  is_completed: boolean
  notes?: string
  created_at: string
  employee?: Employee
}

export interface Offboarding {
  id: string
  employee_id: string
  pic_name?: string
  report_date: string
  quarter: Quarter
  year: number
  offboard_type: 'Resign' | 'End of Contract' | 'Termination' | 'Retirement'
  effective_date: string
  reason_to_leave?: string
  return_assets: boolean
  clearance_letter: boolean
  exit_interview: boolean
  send_paklaring: boolean
  bpjs_deactivated: boolean
  final_payment_done: boolean
  notes?: string
  created_at: string
  employee?: Employee
}

export interface Recruitment {
  id: string
  position: string
  division: string
  entity: Entity
  pic_name?: string
  quarter: Quarter
  year: number
  hiring_source?: string
  target_date?: string
  status: RecruitmentStatus
  total_applicants: number
  screening_count: number
  interview_count: number
  offering_count: number
  hired_date?: string
  notes?: string
  created_at: string
}

export interface TNARecord {
  id: string
  employee_id: string
  year: number
  quarter?: Quarter
  training_name: string
  training_category?: string
  training_method?: string
  vendor?: string
  target_date?: string
  actual_date?: string
  duration_hours?: number
  cost: number
  status: TNAStatus
  score?: number
  notes?: string
  created_at: string
  employee?: Employee
}

export interface PIPRecord {
  id: string
  employee_id: string
  pic_name?: string
  type: PIPType
  issue_date: string
  end_date?: string
  reason: string
  improvement_plan?: string
  status: string
  result?: string
  notes?: string
  created_at: string
  employee?: Employee
}

export interface SalaryRecord {
  id: string
  employee_id: string
  year: number
  month: number
  basic_salary: number
  allowance: number
  overtime: number
  bonus: number
  deduction: number
  bpjs_ketenagakerjaan: number
  bpjs_kesehatan: number
  pph21: number
  net_salary: number
  payment_date?: string
  is_paid: boolean
  notes?: string
  created_at: string
  employee?: Employee
}

export interface AttendanceLeave {
  id: string
  employee_id: string
  leave_type: LeaveType
  start_date: string
  end_date: string
  total_days: number
  status: string
  notes?: string
  created_at: string
  employee?: Employee
}

export interface EngagementSurvey {
  id: string
  year: number
  quarter: Quarter
  division: string
  engagement_score?: number
  satisfaction_score?: number
  response_count: number
  total_count: number
  notes?: string
  created_at: string
}

// Dashboard aggregates
export interface DashboardStats {
  total_active: number
  total_pkwtt: number
  total_pkwt: number
  resign_qtd: number
  end_contract_qtd: number
  contracts_expiring_soon: number
  tna_overdue: number
  pip_active: number
  open_recruitment: number
  on_leave_today: number
  avg_yos: number
  turnover_rate: number
}
