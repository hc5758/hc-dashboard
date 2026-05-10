import { createServiceClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import Topbar from '@/components/layout/Topbar'
import EngagementClient from './EngagementClient'

export default async function EngagementPage() {
  const db = createServiceClient()
  const [{ data: surveys2026 }, { data: surveys2025 }, { data: offboarding }, { data: employees }] = await Promise.all([
    db.from('engagement_surveys').select('*').eq('year', 2026).order('engagement_score', { ascending: false }),
    db.from('engagement_surveys').select('*').eq('year', 2025).order('engagement_score', { ascending: false }),
    db.from('offboarding').select('*, employee:employees(division)'),
    db.from('employees').select('division').eq('status', 'active'),
  ])
  return (
    <div className="page-wrapper">
      <Topbar title="Employee Engagement" subtitle="Survey 2026" />
      <div className="page-content">
        <EngagementClient surveys={surveys2026 ?? []} surveys2025={surveys2025 ?? []} offboarding={offboarding ?? []} employees={employees ?? []} />
      </div>
    </div>
  )
}
