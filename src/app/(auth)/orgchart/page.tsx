import { createServiceClient } from '@/lib/supabase/server'
import { decryptMany } from '@/lib/crypto'
import Topbar from '@/components/layout/Topbar'
import OrgChartClient from './OrgChartClient'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OrgChartPage() {
  const db = createServiceClient()
  const { data: employees } = await db
    .from('employees')
    .select('id,full_name,position,level,division,entity,employment_type,status,join_date')
    .eq('status', 'active')
    .order('division')
  const decrypted = await decryptMany(employees ?? [], [{ key: 'full_name', type: 'string' as const }])
  return (
    <div className="page-wrapper">
      <Topbar title="Org Chart" subtitle="Struktur organisasi · Aktif 2026" />
      <div className="page-content">
        <OrgChartClient employees={decrypted} />
      </div>
    </div>
  )
}
