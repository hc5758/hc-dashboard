import { createServiceClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import TurnoverClient from './TurnoverClient'

export default async function TurnoverPage() {
  const db = createServiceClient()
  const [{ data: offboarding }, { data: employees }, { data: allEmp }] = await Promise.all([
    db.from('offboarding').select('*, employee:employees(full_name,division,join_date,level)').order('report_date',{ascending:false}),
    db.from('employees').select('id,full_name,division').order('full_name'),
    db.from('employees').select('*'),
  ])
  const active = (allEmp??[]).filter(e=>e.status==='active')
  return (
    <div className="page-wrapper">
      <Topbar title="Turnover & Retention" subtitle="Q2 2026"/>
      <div className="flex-1 overflow-y-auto p-6">
        <TurnoverClient offboarding={offboarding??[]} employees={employees??[]} active={active}/>
      </div>
    </div>
  )
}
