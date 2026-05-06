import { createServiceClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import { KPICard, InlineBar, InsightCard } from '@/components/ui'
import { cn } from '@/lib/utils'

export default async function EngagementPage() {
  const db = createServiceClient()
  const { data: surveys } = await db.from('engagement_surveys').select('*').eq('year', 2026).order('engagement_score', { ascending: false })

  const avgEng = surveys && surveys.length > 0 ? (surveys.reduce((s, sv) => s + (sv.engagement_score ?? 0), 0) / surveys.length).toFixed(1) : '–'
  const avgSat = surveys && surveys.length > 0 ? (surveys.reduce((s, sv) => s + (sv.satisfaction_score ?? 0), 0) / surveys.length).toFixed(1) : '–'
  const totalResp = (surveys ?? []).reduce((s, sv) => s + sv.response_count, 0)
  const totalCount = (surveys ?? []).reduce((s, sv) => s + sv.total_count, 0)
  const rr = totalCount > 0 ? Math.round(totalResp / totalCount * 100) : 0

  const turnoverByDiv: Record<string, number> = { Creative: 13.3, Marketing: 10, 'Social Media': 14.3, Finance: 0, 'Human Capital': 0, Operations: 0 }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="Employee Engagement" subtitle="Survey Q2 2026" />
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="grid grid-cols-4 gap-3">
          <KPICard label="Avg engagement score"    value={`${avgEng}/5`} change="vs 3.8 Q1" changeType="up" accent="bg-teal-400" />
          <KPICard label="Avg satisfaction (CSAT)" value={`${avgSat}/5`} change="vs 3.5 Q1" changeType="up" accent="bg-blue-400" />
          <KPICard label="Response rate"           value={`${rr}%`}      change="target 80%" changeType="up" accent="bg-amber-400" />
          <KPICard label="eNPS score"              value="+24"            change="Good"       changeType="up" accent="bg-purple-400" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <div className="card-head"><span className="card-title">Engagement score by division</span></div>
            <div className="card-body space-y-2">
              {(surveys ?? []).map(sv => {
                const pct = Math.round((sv.engagement_score ?? 0) / 5 * 100)
                const col = pct >= 80 ? 'bg-teal-500' : pct >= 70 ? 'bg-navy-700' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'
                return <InlineBar key={sv.id} label={sv.division} value={`${sv.engagement_score}/5`} pct={pct} color={col} />
              })}
            </div>
          </div>
          <div className="card">
            <div className="card-head"><span className="card-title">Engagement vs turnover (korelasi)</span></div>
            <div className="card-body">
              <div className="text-[11px] text-navy-300 mb-4">Engagement rendah → turnover tinggi.</div>
              <div className="space-y-3">
                {(surveys ?? []).map(sv => {
                  const turn = turnoverByDiv[sv.division] ?? 0
                  const engBg = (sv.engagement_score ?? 0) >= 4 ? 'bg-teal-50 text-teal-700' : (sv.engagement_score ?? 0) >= 3.5 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                  const turnBg = turn === 0 ? 'bg-teal-50 text-teal-700' : turn >= 12 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                  return (
                    <div key={sv.id} className="flex items-center gap-3">
                      <div className="text-[11px] text-navy-600 w-[90px] flex-shrink-0">{sv.division}</div>
                      <div className="flex gap-2 flex-1">
                        <div className={cn('flex-1 rounded-lg px-3 py-1.5 text-center', engBg)}>
                          <div className="text-[13px] font-extrabold">{sv.engagement_score}</div>
                          <div className="text-[9px]">engagement</div>
                        </div>
                        <div className="flex items-center text-navy-200 text-lg">→</div>
                        <div className={cn('flex-1 rounded-lg px-3 py-1.5 text-center', turnBg)}>
                          <div className="text-[13px] font-extrabold">{turn}%</div>
                          <div className="text-[9px]">turnover</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><span className="card-title">Engagement by tenure</span></div>
          <div className="grid grid-cols-4 divide-x divide-navy-100">
            {[
              { label: '0 – 6 bulan', score: '3.1', color: 'text-amber-600', note: 'Masa adaptasi — terendah' },
              { label: '6 – 12 bulan', score: '3.7', color: 'text-blue-600', note: 'Meningkat pasca probasi' },
              { label: '1 – 2 tahun', score: '4.2', color: 'text-teal-600', note: 'Paling engaged' },
              { label: '> 2 tahun', score: '4.0', color: 'text-teal-600', note: 'Stabil, loyal' },
            ].map(t => (
              <div key={t.label} className="p-5 text-center">
                <div className={cn('text-2xl font-extrabold', t.color)}>{t.score}</div>
                <div className="text-[11px] font-semibold text-navy-800 mt-2">{t.label}</div>
                <div className="text-[10px] text-navy-300 mt-1">{t.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InsightCard title="Engagement 0–6 bulan hanya 3.1 — early attrition risk" text="Karyawan baru paling rentan keluar di 6 bulan pertama. Rekomendasi: buddy system, formal check-in mingguan, onboarding yang lebih structured." color="bg-red-900/80" titleColor="text-red-300" />
          <InsightCard title="Finance: engagement tertinggi (4.4) — zero turnover" text="Finance paling engaged, zero turnover. Capture apa yang dilakukan manager Finance dan jadikan framework untuk divisi lain." color="bg-teal-700" titleColor="text-teal-200" />
        </div>
      </div>
    </div>
  )
}
