import { createServiceClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import { KPICard, Badge, Avatar, InsightCard, ProgressBar } from '@/components/ui'
import { fmtDate, daysUntil, calcYoS, initials } from '@/lib/utils'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const db = createServiceClient()

  const [
    { data: employees },
    { data: contracts },
    { data: onboarding },
    { data: offboarding },
    { data: recruitment },
    { data: tna },
    { data: pip },
    { data: leave },
    { data: salary },
  ] = await Promise.all([
    db.from('employees').select('*').order('full_name'),
    db.from('contracts').select('*, employee:employees(full_name,division,employment_type)').eq('is_active', true),
    db.from('onboarding').select('*, employee:employees(full_name,position,division)').order('created_at', { ascending: false }),
    db.from('offboarding').select('*, employee:employees(full_name,division,join_date)').order('report_date', { ascending: false }),
    db.from('recruitment').select('*').order('created_at', { ascending: false }),
    db.from('tna_records').select('*, employee:employees(full_name,division)').order('created_at', { ascending: false }),
    db.from('pip_sp').select('*, employee:employees(full_name,division)').eq('status', 'Active'),
    db.from('attendance_leave').select('*, employee:employees(full_name,division)').eq('status', 'Approved'),
    db.from('salary_records').select('*, employee:employees(full_name,division)').eq('year', 2026).eq('month', 5),
  ])

  const active = employees?.filter(e => e.status === 'active') ?? []
  const today = new Date()

  const expiringContracts = contracts?.filter(c => {
    const d = daysUntil(c.end_date)
    return d >= 0 && d <= 30
  }).sort((a, b) => daysUntil(a.end_date) - daysUntil(b.end_date)) ?? []

  const onLeaveNow = leave?.filter(l => {
    const s = new Date(l.start_date), e = new Date(l.end_date)
    return today >= s && today <= e
  }) ?? []

  const birthdayThisMonth = active.filter(e => {
    if (!e.birth_date) return false
    return new Date(e.birth_date).getMonth() === today.getMonth()
  }).sort((a, b) => new Date(a.birth_date!).getDate() - new Date(b.birth_date!).getDate())

  const openRec = recruitment?.filter(r => ['Open','In Progress','Offering'].includes(r.status)) ?? []
  const tnaOverdue = tna?.filter(t => t.status === 'Overdue') ?? []

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="Dashboard" subtitle="Q2 · 2026" />
      <div className="flex-1 overflow-y-auto p-6">
        <DashboardClient
          employees={active}
          expiringContracts={expiringContracts}
          onboarding={onboarding ?? []}
          offboarding={offboarding ?? []}
          recruitment={openRec}
          tnaOverdue={tnaOverdue}
          pip={pip ?? []}
          onLeave={onLeaveNow}
          birthdays={birthdayThisMonth}
          salary={salary ?? []}
        />
      </div>
    </div>
  )
}
