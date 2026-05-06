import { createServiceClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import CutiClient from './CutiClient'

export default async function AttendancePage() {
  const db = createServiceClient()
  const [{ data: leave }, { data: employees }] = await Promise.all([
    db.from('attendance_leave')
      .select('*, employee:employees(full_name, division, gender)')
      .order('start_date', { ascending: false }),
    db.from('employees')
      .select('id, full_name, division')
      .eq('status', 'active')
      .order('full_name'),
  ])
  return (
    <div className="page-wrapper">
      <Topbar title="Manajemen Cuti" subtitle="2026" />
      <div className="flex-1 overflow-y-auto p-6">
        <CutiClient leave={leave ?? []} employees={employees ?? []} />
      </div>
    </div>
  )
}
