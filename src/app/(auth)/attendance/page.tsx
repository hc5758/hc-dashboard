import { createServiceClient } from '@/lib/supabase/server'
import { decryptMany } from '@/lib/crypto'
import Topbar from '@/components/layout/Topbar'
import CutiClient from './CutiClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

  const DEC = [{ key: 'full_name', type: 'string' as const }]

  // Decrypt employees list
  const decEmployees = await decryptMany(employees ?? [], DEC)

  // Decrypt nested employee.full_name in leave records
  const decLeave = await Promise.all((leave ?? []).map(normalizeDates).map(async (l: any) => ({
    ...l,
    employee: l.employee ? (await decryptMany([l.employee], DEC))[0] : l.employee
  })))

  // Decrypt nested employee.full_name in balances
  const decBalances = await Promise.all((balances ?? []).map(async (b: any) => ({
    ...b,
    employee: b.employee ? (await decryptMany([b.employee], DEC))[0] : b.employee
  })))

  return (
    <div className="page-wrapper">
      <Topbar title="Manajemen Cuti" subtitle="2026"/>
      <div className="page-content">
        <CutiClient leave={decLeave} employees={decEmployees} balances={decBalances}/>
      </div>
    </div>
  )
}
