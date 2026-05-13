import { decryptMany } from '@/lib/crypto'
import { createServiceClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import TeamDetailClient from './TeamDetailClient'

export default async function TeamDetailPage({ params }: { params: { division: string } }) {
  const division = decodeURIComponent(params.division)
  const db = createServiceClient()
  const [{ data: employees }, { data: pip }, { data: tna }] = await Promise.all([
    db.from('employees').select('*').eq('division', division).eq('status', 'active').order('full_name'),
    db.from('pip_sp').select('*, employee:employees(full_name,division)').order('issue_date', { ascending: false }),
    db.from('tna_records').select('*').order('created_at', { ascending: false }),
  ])
  const DEC = [{ key: 'full_name', type: 'string' as const }]
  const decEmp = await decryptMany(employees ?? [], DEC)
  return (
    <div className="page-wrapper">
      <Topbar title={`Performance — ${division}`} subtitle="Detail tim · Q1 2026" />
      <div className="page-content">
        <TeamDetailClient
          division={division}
          employees={decEmp}
          pip={pip ?? []}
          tna={tna ?? []}
        />
      </div>
    </div>
  )
}
