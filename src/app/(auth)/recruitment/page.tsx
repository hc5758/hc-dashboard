import { createServiceClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import RecruitmentClient from './RecruitmentClient'

export default async function RecruitmentPage() {
  const db = createServiceClient()
  const { data: recruitment } = await db.from('recruitment').select('*').order('created_at', { ascending: false })
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="Recruitment" subtitle="Q2 2026" />
      <div className="flex-1 overflow-y-auto p-6">
        <RecruitmentClient recruitment={recruitment ?? []} />
      </div>
    </div>
  )
}
