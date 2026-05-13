import { decryptMany } from '@/lib/crypto'
import { createServiceClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import Topbar from '@/components/layout/Topbar'
import TurnoverClient from './TurnoverClient'

export default async function TurnoverPage() {
  const db = createServiceClient()
  const [{ data: offboarding }, { data: employees }, { data: allEmp }] = await Promise.all([
    db.from('offboarding').select('*, employee:employees(full_name,division,join_date,level)').order('report_date',{ascending:false}),
    db.from('employees').select('id,full_name,division').order('full_name'),
    db.from('employees').select('*'),
  ])
  const DEC = [{ key: 'full_name', type: 'string' as const }]
  const decEmp    = await decryptMany(employees ?? [], DEC)
  const decAllEmp = await decryptMany(allEmp ?? [], DEC)
  const active    = decAllEmp.filter(e=>e.status==='active')

  // Decrypt nested employee.full_name in offboarding
  const decOffboarding = await Promise.all((offboarding ?? []).map(async (o:any) => ({
    ...o,
    employee: o.employee ? (await decryptMany([o.employee], DEC))[0] : o.employee
  })))
  return (
    <div className="page-wrapper">
      <Topbar title="Turnover & Retention" subtitle="Q2 2026"/>
      <div className="flex-1 overflow-y-auto p-6">
        <TurnoverClient offboarding={decOffboarding} employees={decEmp} active={active}/>
      </div>
    </div>
  )
}
