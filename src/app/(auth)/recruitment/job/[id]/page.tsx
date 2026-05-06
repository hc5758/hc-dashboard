import { createServiceClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import JobDetailClient from './JobDetailClient'

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const db = createServiceClient()
  const [{ data: job }, { data: candidates }] = await Promise.all([
    db.from('recruitment').select('*').eq('id', params.id).single(),
    db.from('recruitment_candidates').select('*').eq('recruitment_id', params.id).order('created_at', { ascending: false }),
  ])

  if (!job) return (
    <div className="page-wrapper">
      <Topbar title="Posisi tidak ditemukan" />
      <div className="page-content"><p className="text-slate-400">Data tidak ditemukan.</p></div>
    </div>
  )

  return (
    <div className="page-wrapper">
      <Topbar title={job.position} subtitle={`${job.division} · ${job.entity} · ${job.status}`} />
      <div className="page-content">
        <JobDetailClient job={job} candidates={candidates ?? []} />
      </div>
    </div>
  )
}
