import { createServiceClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import Topbar from '@/components/layout/Topbar'
import PayrollClient from './PayrollClient'

export default async function PayrollPage() {
  const db = createServiceClient()
  const [{ data: salary }, { data: employees }] = await Promise.all([
    db.from('salary_records').select('*, employee:employees(full_name,division)').order('year',{ascending:false}).order('month',{ascending:false}),
    db.from('employees').select('id,full_name,division').eq('status','active').order('full_name'),
  ])
  return (
    <div className="page-wrapper">
      <Topbar title="Payroll Overview" subtitle="2026"/>
      <div className="page-content">
        <PayrollClient salary={salary??[]} employees={employees??[]}/>
      </div>
    </div>
  )
}
