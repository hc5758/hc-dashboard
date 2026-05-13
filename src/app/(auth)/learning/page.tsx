import { decryptMany } from '@/lib/crypto'
import { createServiceClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import Topbar from '@/components/layout/Topbar'
import LearningClient from './LearningClient'

export default async function LearningPage() {
  const db = createServiceClient()
  const [{ data: tna }, { data: employees }] = await Promise.all([
    db.from('tna_records').select('*, employee:employees(full_name,division)').order('created_at', { ascending: false }),
    db.from('employees').select('id,full_name,division,position,join_date,employment_type').eq('status', 'active').order('full_name'),
  ])
  const DEC = [{ key: 'full_name', type: 'string' as const }]
  const decEmp = await decryptMany(employees ?? [], DEC)

  // Decrypt nested employee.full_name in tna records
  const decTna = await Promise.all((tna ?? []).map(async (t:any) => ({
    ...t,
    employee: t.employee ? (await decryptMany([t.employee], DEC))[0] : t.employee
  })))

  return (
    <div className="page-wrapper">
      <Topbar title="Learning & Development" subtitle="YTD 2026" />
      <div className="page-content">
        <LearningClient tna={decTna} employees={decEmp} />
      </div>
    </div>
  )
}
