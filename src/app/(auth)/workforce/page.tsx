import { createServiceClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import Topbar from '@/components/layout/Topbar'
import WorkforceClient from './WorkforceClient'
import { decryptMany } from '@/lib/crypto'

export default async function WorkforcePage() {
  const db = createServiceClient()
  const { data: employees } = await db.from('employees').select('*').order('created_at', { ascending: false })
  const decrypted = await decryptMany(employees ?? [], [{ key: 'full_name', type: 'string' }])
  return (
    <div className="page-wrapper">
      <Topbar title="Workforce Overview" subtitle="All entities · 2026" />
      <div className="page-content">
        <WorkforceClient employees={decrypted} />
      </div>
    </div>
  )
}
