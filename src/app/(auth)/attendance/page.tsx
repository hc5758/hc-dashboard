import { createServiceClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import CutiClient from './CutiClient'

function normalizeDates(row: any) {
  if (!row) return row
  const result = { ...row }
  ;['start_date','end_date'].forEach(f => {
    if (result[f] && result[f].length > 10) result[f] = result[f].slice(0, 10)
  })
  return result
}

export default async function AttendancePage() {
  const db = createServiceClient()
  const [{ data: leave }, { data: employees }, { data: balances }] = await Promise.all([
    db.from('attendance_leave')
      .select('*, employee:employees(full_name,division,gender)')
      .order('start_date', { ascending: false }),
    db.from('employees')
      .select('id,full_name,division,join_date,employment_type')
      .eq('status','active').order('full_name'),
    db.from('leave_balance')
      .select('*, employee:employees(full_name,division,join_date)'),
  ])

  // Normalize dates di server sebelum dikirim ke client
  const normalizedLeave = (leave ?? []).map(normalizeDates)

  return (
    <div className="page-wrapper">
      <Topbar title="Manajemen Cuti" subtitle="2026"/>
      <div className="page-content">
        <CutiClient leave={normalizedLeave} employees={employees??[]} balances={balances??[]}/>
      </div>
    </div>
  )
}
