import { createServiceClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import Topbar from '@/components/layout/Topbar'
import WorkforceClient from './WorkforceClient'

export default async function WorkforcePage() {
  const db = createServiceClient()
  const { data: employees } = await db.from('employees').select('*').order('full_name')
  return (
    <div className="page-wrapper">
      <Topbar title="Workforce Overview" subtitle="All entities · 2026" />
      <div className="page-content">
        <WorkforceClient employees={employees ?? []} />
      </div>
    </div>
  )
}
