import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import { formatDate, calcYoSDecimal, daysUntil, formatCurrency } from '@/lib/utils'
import { differenceInDays, parseISO, isSameMonth } from 'date-fns'
import AlertStrip from '@/components/dashboard/AlertStrip'
import HeroSection from '@/components/dashboard/HeroSection'
import KPIRow from '@/components/dashboard/KPIRow'
import RecruitmentCard from '@/components/dashboard/RecruitmentCard'
import ContractAlertCard from '@/components/dashboard/ContractAlertCard'
import BirthdayCard from '@/components/dashboard/BirthdayCard'
import LeaveCard from '@/components/dashboard/LeaveCard'
import OnboardingCard from '@/components/dashboard/OnboardingCard'
import TNAProgressCard from '@/components/dashboard/TNAProgressCard'
import OffboardSummaryCard from '@/components/dashboard/OffboardSummaryCard'
import ActivityCard from '@/components/dashboard/ActivityCard'
import GenderDonutCard from '@/components/dashboard/GenderDonutCard'
import SalaryBarCard from '@/components/dashboard/SalaryBarCard'
import TurnoverCard from '@/components/dashboard/TurnoverCard'

export default async function DashboardPage() {
  const supabase = createClient()
  const today = new Date()

  const [
    { data: employees },
    { data: contracts },
    { data: onboarding },
    { data: offboarding },
    { data: recruitment },
    { data: tnaRecords },
    { data: pipRecords },
    { data: leaveRecords },
    { data: salaryRecords },
  ] = await Promise.all([
    supabase.from('employees').select('*').order('full_name'),
    supabase.from('contracts').select('*, employee:employees(*)').eq('is_active', true),
    supabase.from('onboarding').select('*, employee:employees(*), pic:admin_users(*)').order('created_at', { ascending: false }),
    supabase.from('offboarding').select('*, employee:employees(*), pic:admin_users(*)').order('created_at', { ascending: false }),
    supabase.from('recruitment').select('*, pic:admin_users(*)').order('created_at', { ascending: false }),
    supabase.from('tna_records').select('*, employee:employees(*)').order('created_at', { ascending: false }),
    supabase.from('pip_sp').select('*, employee:employees(*)').eq('status', 'Active'),
    supabase.from('attendance_leave').select('*, employee:employees(*)').order('start_date', { ascending: false }),
    supabase.from('salary_records').select('*, employee:employees(division, full_name)').eq('year', 2024).order('month'),
  ])

  const activeEmployees = employees?.filter(e => e.status === 'active') || []
  const pkwttCount = activeEmployees.filter(e => e.employment_type === 'PKWTT').length
  const pkwtCount = activeEmployees.filter(e => e.employment_type === 'PKWT').length

  const avgYoS = activeEmployees.length > 0
    ? (activeEmployees.reduce((sum, e) => sum + calcYoSDecimal(e.join_date), 0) / activeEmployees.length).toFixed(2)
    : '0'

  const resignQ1 = offboarding?.filter(o =>
    o.quarter === 'Q1' && o.year === 2024 && o.offboard_type === 'Resign'
  ).length || 0

  const endOCQ1 = offboarding?.filter(o =>
    o.quarter === 'Q1' && o.year === 2024 && o.offboard_type === 'End of Contract'
  ).length || 0

  // Contracts expiring < 30 days
  const expiringContracts = contracts?.filter(c => {
    if (!c.end_date) return false
    const days = daysUntil(c.end_date)
    return days >= 0 && days <= 30
  }) || []

  // Probation ending (employees with < 3 months tenure)
  const probationEnding = activeEmployees.filter(e => {
    const months = differenceInDays(today, parseISO(e.join_date)) / 30
    return months >= 2.5 && months <= 3.5
  })

  // TNA overdue
  const tnaOverdue = tnaRecords?.filter(t => t.status === 'Overdue') || []

  // Open recruitment
  const openRecruitment = recruitment?.filter(r =>
    ['Open', 'In Progress', 'Offering'].includes(r.status)
  ) || []

  // Birthday this month
  const birthdayThisMonth = activeEmployees.filter(e => {
    if (!e.birth_date) return false
    const bday = parseISO(e.birth_date)
    return bday.getMonth() === today.getMonth()
  }).sort((a, b) => {
    const aDay = parseISO(a.birth_date!).getDate()
    const bDay = parseISO(b.birth_date!).getDate()
    return aDay - bDay
  })

  // On leave this week
  const onLeaveNow = leaveRecords?.filter(l => {
    const start = parseISO(l.start_date)
    const end = parseISO(l.end_date)
    return today >= start && today <= end && l.status === 'Approved'
  }) || []

  const stats = {
    total_active: activeEmployees.length,
    total_pkwtt: pkwttCount,
    total_pkwt: pkwtCount,
    avg_yos: parseFloat(avgYoS),
    resign_qtd: resignQ1,
    end_contract_qtd: endOCQ1,
    open_recruitment: openRecruitment.length,
    tna_overdue: tnaOverdue.length,
    contracts_expiring_soon: expiringContracts.length,
    probation_ending: probationEnding.length,
    pip_active: pipRecords?.length || 0,
    on_leave_today: onLeaveNow.length,
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="HC Dashboard 2026" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-4">

          <AlertStrip stats={stats} />
          <HeroSection stats={stats} />
          <KPIRow stats={stats} employees={activeEmployees} />

          {/* Row: Recruitment + Kontrak Alert + Birthday + Cuti */}
          <div className="grid grid-cols-4 gap-3">
            <RecruitmentCard recruitment={openRecruitment} />
            <ContractAlertCard contracts={expiringContracts} />
            <BirthdayCard employees={birthdayThisMonth} />
            <LeaveCard leaves={onLeaveNow} />
          </div>

          {/* Row: Onboarding + Activity */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <OnboardingCard onboarding={onboarding || []} />
            </div>
            <ActivityCard
              offboarding={offboarding || []}
              tnaOverdue={tnaOverdue}
              expiringContracts={expiringContracts}
            />
          </div>

          {/* Row: TNA + Offboard + Gender + Salary + Turnover */}
          <div className="grid grid-cols-4 gap-3">
            <TNAProgressCard tnaRecords={tnaRecords || []} employees={activeEmployees} />
            <OffboardSummaryCard offboarding={offboarding || []} />
            <GenderDonutCard employees={employees || []} />
            <SalaryBarCard salaryRecords={salaryRecords || []} />
          </div>

        </div>
      </div>
    </div>
  )
}
