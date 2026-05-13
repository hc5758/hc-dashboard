import { decryptMany } from '@/lib/crypto'
import { createServiceClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import Topbar from '@/components/layout/Topbar'
import PerformanceClient from './PerformanceClient'

export default async function PerformancePage() {
  const db = createServiceClient()
  const [{ data: pip }, { data: tna }, { data: employees }, { data: scores }] = await Promise.all([
    db.from('pip_sp').select('*, employee:employees(full_name,division)').order('issue_date',{ascending:false}),
    db.from('tna_records').select('*').not('score','is',null),
    db.from('employees').select('id,full_name,division').eq('status','active').order('full_name'),
    db.from('performance_scores').select('*, employee:employees(full_name,division)').order('year',{ascending:false}),
  ])
  const DEC = [{ key: 'full_name', type: 'string' as const }]
  const decEmp = await decryptMany(employees ?? [], DEC)

  // Decrypt nested employee.full_name in pip and scores
  const decPip = await Promise.all((pip ?? []).map(async (p:any) => ({
    ...p,
    employee: p.employee ? (await decryptMany([p.employee], DEC))[0] : p.employee
  })))
  const decScores = await Promise.all((scores ?? []).map(async (s:any) => ({
    ...s,
    employee: s.employee ? (await decryptMany([s.employee], DEC))[0] : s.employee
  })))

  return (
    <div className="page-wrapper">
      <Topbar title="Performance" subtitle="Review Q1 2026"/>
      <div className="page-content">
        <PerformanceClient pip={decPip} employees={decEmp} tna={tna??[]} scores={decScores}/>
      </div>
    </div>
  )
}
