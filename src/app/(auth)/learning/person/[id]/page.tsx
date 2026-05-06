import { createServiceClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import PersonLearningClient from './PersonLearningClient'

export default async function PersonLearningPage({ params }: { params: { id: string } }) {
  const db = createServiceClient()
  const [{ data: employee }, { data: tna }] = await Promise.all([
    db.from('employees').select('*').eq('id', params.id).single(),
    db.from('tna_records').select('*').eq('employee_id', params.id).order('created_at', { ascending: false }),
  ])

  if (!employee) return (
    <div className="page-wrapper">
      <Topbar title="Karyawan tidak ditemukan" />
      <div className="page-content"><p className="text-slate-400">Data tidak ditemukan.</p></div>
    </div>
  )

  return (
    <div className="page-wrapper">
      <Topbar title={`Learning — ${employee.full_name}`} subtitle={`${employee.division} · ${employee.position}`} />
      <div className="page-content">
        <PersonLearningClient employee={employee} tna={tna ?? []} />
      </div>
    </div>
  )
}
