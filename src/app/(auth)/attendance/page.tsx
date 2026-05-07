import { createServiceClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import CutiClient from './CutiClient'

export default async function AttendancePage() {
  const db = createServiceClient()
  const [{ data: leave }, { data: employees }, { data: balances }] = await Promise.all([
    db.from('attendance_leave').select('*, employee:employees(full_name,division,gender)').order('start_date',{ascending:false}),
    db.from('employees').select('id,full_name,division,join_date,employment_type').eq('status','active').order('full_name'),
    db.from('leave_balance').select('*, employee:employees(full_name,division,join_date)').eq('year',2026),
  ])
  return (
    <div className="page-wrapper">
      <Topbar title="Manajemen Cuti" subtitle="2026"/>
      <div className="page-content">
        <CutiClient leave={leave??[]} employees={employees??[]} balances={balances??[]}/>
      </div>
    </div>
  )
}
