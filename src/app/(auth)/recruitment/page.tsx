import { createServiceClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import Topbar from '@/components/layout/Topbar'
import RecruitmentClient from './RecruitmentClient'

export default async function RecruitmentPage() {
  const db = createServiceClient()
  const { data: recruitment } = await db.from('recruitment').select('*').order('created_at', { ascending: false })
  return (
    <div className="page-wrapper">
      <Topbar title="Recruitment" subtitle="Q2 2026" />
      <div className="page-content">
        <RecruitmentClient recruitment={recruitment ?? []} />
      </div>
    </div>
  )
}
