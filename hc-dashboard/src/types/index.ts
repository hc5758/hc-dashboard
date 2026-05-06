export type AdminRole = 'super_admin' | 'hr_manager' | 'hr_staff'
export type EmploymentType = 'PKWTT' | 'PKWT'
export type EmployeeStatus = 'active' | 'inactive' | 'resigned' | 'end_contract'
export type Gender = 'Laki-laki' | 'Perempuan'
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'
export type ContractType = 'PKWTT' | 'PKWT' | 'Probasi'
export type OffboardType = 'Resign' | 'End of Contract' | 'Termination' | 'Retirement'
export type TNAStatus = 'Planned' | 'In Progress' | 'Done' | 'Overdue' | 'Cancelled'
export type PIPType = 'SP1' | 'SP2' | 'SP3' | 'PIP'
export type LeaveType = 'Tahunan' | 'Sakit' | 'Melahirkan' | 'Penting' | 'Cuti Bersama' | 'Unpaid'
export type RecruitmentStatus = 'Open' | 'In Progress' | 'Offering' | 'Hired' | 'On Hold' | 'Cancelled'

export type Entity = 'SSR' | 'Nyambee (PAT)' | 'PAT-5758'

export type EmployeeLevel =
  | 'Director' | 'Head' | 'Sr. Manager' | 'Manager' | 'Jr. Manager'
  | 'Sr. Specialist' | 'Specialist' | 'Jr. Specialist'
  | 'Sr. Officer' | 'Officer'
  | 'Sr. Staff' | 'Staff' | 'Jr. Staff' | 'Associate'

export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: AdminRole
  avatar_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Employee {
  id: string
  employee_id: string
  full_name: string
  email?: string
  phone?: string
  position: string
  level?: EmployeeLevel
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
  superior_id?: string
  bank_name?: string
  bank_account?: string
  address?: string
  emergency_contact?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Contract {
  id: string
  employee_id: string
  contract_type: ContractType
  contract_number?: string
  start_date: string
  end_date?: string
  is_active: boolean
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  employee?: Employee
}

export interface Onboarding {
  id: string
  employee_id: string
  pic_id?: string
  quarter: Quarter
  year: number
  hiring_source?: string
  placement_location?: string
  update_to_structure: boolean
  send_job_description: boolean
  session_1: boolean
  session_1_date?: string
  session_1_notes?: string
  session_2: boolean
  session_2_date?: string
  session_2_notes?: string
  session_3: boolean
  session_3_date?: string
  session_3_notes?: string
  session_4: boolean
  session_4_date?: string
  session_4_notes?: string
  is_completed: boolean
  completed_date?: string
  notes?: string
  created_at: string
  updated_at: string
  employee?: Employee
  pic?: AdminUser
}

export interface Offboarding {
  id: string
  employee_id: string
  pic_id?: string
  report_date: string
  quarter: Quarter
  year: number
  offboard_type: OffboardType
  effective_date: string
  reason_to_leave?: string
  return_assets: boolean
  return_assets_date?: string
  clearance_letter: boolean
  clearance_letter_date?: string
  exit_interview: boolean
  exit_interview_date?: string
  send_paklaring: boolean
  send_paklaring_date?: string
  bpjs_deactivated: boolean
  final_payment_done: boolean
  final_payment_date?: string
  notes?: string
  created_at: string
  updated_at: string
  employee?: Employee
  pic?: AdminUser
}

export interface Recruitment {
  id: string
  position: string
  division: string
  entity: Entity
  pic_id?: string
  quarter: Quarter
  year: number
  hiring_source?: string
  target_date?: string
  status: RecruitmentStatus
  total_applicants: number
  screening_count: number
  interview_count: number
  offering_count: number
  hired_employee_id?: string
  hired_date?: string
  notes?: string
  created_at: string
  updated_at: string
  pic?: AdminUser
}

export interface TNARecord {
  id: string
  employee_id: string
  pic_id?: string
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
  certificate_url?: string
  notes?: string
  created_at: string
  updated_at: string
  employee?: Employee
}

export interface Promotion {
  id: string
  employee_id: string
  promotion_type: string
  quarter?: Quarter
  year: number
  old_position: string
  new_position: string
  old_division?: string
  new_division?: string
  old_level?: string
  new_level?: string
  effective_date: string
  notes?: string
  created_at: string
  updated_at: string
  employee?: Employee
}

export interface PIPRecord {
  id: string
  employee_id: string
  pic_id?: string
  type: PIPType
  issue_date: string
  end_date?: string
  reason: string
  improvement_plan?: string
  status: string
  result?: string
  notes?: string
  created_at: string
  updated_at: string
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
  approved_by?: string
  notes?: string
  created_at: string
  employee?: Employee
}

export interface ActivityLog {
  id: string
  admin_id?: string
  action: string
  table_name?: string
  record_id?: string
  description?: string
  created_at: string
  admin?: AdminUser
}

// Dashboard summary types
export interface DashboardStats {
  total_active: number
  total_pkwtt: number
  total_pkwt: number
  avg_yos: number
  resign_qtd: number
  end_contract_qtd: number
  open_recruitment: number
  tna_overdue: number
  contracts_expiring_soon: number
  probation_ending: number
  pip_active: number
  on_leave_today: number
}
