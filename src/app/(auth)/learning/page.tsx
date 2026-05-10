import { createServiceClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import Topbar from '@/components/layout/Topbar'
import LearningClient from './LearningClient'

export default async function LearningPage() {
  const db = createServiceClient()
  const [{ data: tna }, { data: employees }] = await Promise.all([
    db.from('tna_records').select('*, employee:employees(full_name,division)').order('created_at', { ascending: false }),
    db.from('employees').select('id,full_name,division').eq('status', 'active').order('full_name'),
  ])
  return (
    <div className="page-wrapper">
      <Topbar title="Learning & Development" subtitle="YTD 2026" />
      <div className="page-content">
        <LearningClient tna={tna ?? []} employees={employees ?? []} />
      </div>
    </div>
  )
}
