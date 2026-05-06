import { createServiceClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import PerformanceClient from './PerformanceClient'

export default async function PerformancePage() {
  const db = createServiceClient()
  const [{ data: pip }, { data: tna }, { data: employees }] = await Promise.all([
    db.from('pip_sp').select('*, employee:employees(full_name,division)').order('issue_date',{ascending:false}),
    db.from('tna_records').select('*').not('score','is',null),
    db.from('employees').select('id,full_name,division').eq('status','active').order('full_name'),
  ])
  return (
    <div className="page-wrapper">
      <Topbar title="Performance" subtitle="Review Q1 2026"/>
      <div className="page-content">
        <PerformanceClient pip={pip??[]} employees={employees??[]} tna={tna??[]}/>
      </div>
    </div>
  )
}
