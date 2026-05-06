import { createServiceClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import { KPICard, Badge, FunnelRow, InlineBar, InsightCard, EmptyState } from '@/components/ui'
import { fmtDate, calcYoS, cn } from '@/lib/utils'

export default async function TurnoverPage() {
  const db = createServiceClient()
  const [{ data: offboarding }, { data: employees }] = await Promise.all([
    db.from('offboarding').select('*, employee:employees(full_name,division,join_date,level)').order('report_date', { ascending: false }),
    db.from('employees').select('*'),
  ])

  const active = employees?.filter(e => e.status === 'active') ?? []
  const resigned = offboarding?.filter(o => o.offboard_type === 'Resign') ?? []
  const endOC = offboarding?.filter(o => o.offboard_type === 'End of Contract') ?? []
  const total = offboarding?.length ?? 0
  const turnoverRate = active.length > 0 ? ((total / (active.length + total)) * 100).toFixed(1) : '0'

  const byDiv = (offboarding ?? []).reduce((acc: any, o) => {
    const d = o.employee?.division ?? 'Unknown'
    acc[d] = (acc[d] || 0) + 1; return acc
  }, {})

  const divData = Object.entries(byDiv).sort((a: any, b: any) => b[1] - a[1])
  const maxDiv = divData[0]?.[1] as number || 1

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="Turnover & Retention" subtitle="Q1–Q2 2026" />
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        <div className="grid grid-cols-4 gap-3">
          <KPICard label="Turnover rate"   value={`${turnoverRate}%`} change="target <5%"    changeType="down"    accent="bg-red-400" />
          <KPICard label="Total resignasi" value={resigned.length}    change="Q1 2026"       changeType="neutral" accent="bg-amber-400" />
          <KPICard label="End of contract" value={endOC.length}       change="Q1 2026"       changeType="neutral" accent="bg-blue-400" />
          <KPICard label="Retention rate"  value={`${(100 - parseFloat(turnoverRate)).toFixed(1)}%`} change="vs 91.4% Q4" changeType="up" accent="bg-teal-400" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <div className="card-head"><span className="card-title">Turnover by division</span></div>
            <div className="card-body space-y-2">
              {divData.map(([div, count]) => {
                const divActive = active.filter(e => e.division === div).length
                const rate = divActive > 0 ? Math.round((count as number) / ((count as number) + divActive) * 100) : 0
                const col = rate >= 12 ? 'bg-red-500' : rate >= 8 ? 'bg-amber-500' : 'bg-teal-500'
                return <InlineBar key={div} label={div as string} value={`${rate}%`}
                  pct={Math.round((count as number / maxDiv) * 100)} color={col} />
              })}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><span className="card-title">Turnover by tenure</span></div>
            <div className="card-body space-y-4">
              {[
                { label: '0 – 6 bulan', count: resigned.filter(o => { const m = (new Date().getTime() - new Date(o.employee?.join_date).getTime()) / (1000*60*60*24*30); return m <= 6 }).length, total: resigned.length, color: 'bg-red-500', note: 'Early attrition — paling concern' },
                { label: '6 – 12 bulan', count: resigned.filter(o => { const m = (new Date().getTime() - new Date(o.employee?.join_date).getTime()) / (1000*60*60*24*30); return m > 6 && m <= 12 }).length, total: resigned.length, color: 'bg-amber-500', note: '' },
                { label: '> 1 tahun', count: resigned.filter(o => { const m = (new Date().getTime() - new Date(o.employee?.join_date).getTime()) / (1000*60*60*24*30); return m > 12 }).length, total: resigned.length, color: 'bg-teal-500', note: '' },
              ].map(t => {
                const pct = t.total > 0 ? Math.round(t.count / t.total * 100) : 0
                return (
                  <div key={t.label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[12px] font-semibold">{t.label}</span>
                      <span className={`text-[12px] font-extrabold ${t.color.replace('bg-','text-').replace('-500','-600')}`}>{t.count} orang ({pct}%)</span>
                    </div>
                    <div className="prog-bar h-2"><div className={cn('prog-fill', t.color)} style={{width:`${pct}%`}} /></div>
                    {t.note && <div className="text-[10px] text-navy-400 mt-1">{t.note}</div>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="card overflow-x-auto">
          <div className="card-head"><span className="card-title">Detail karyawan keluar</span><Badge variant="red">{total} total</Badge></div>
          <table className="tbl" style={{minWidth:800}}>
            <thead><tr><th>Nama</th><th>Divisi</th><th>Level</th><th>Tenure</th><th>Tipe</th><th>Alasan</th><th>Eff. date</th>
              <th className="text-center">Aset</th><th className="text-center">Clearance</th><th className="text-center">Paklaring</th>
            </tr></thead>
            <tbody>
              {(offboarding ?? []).map(o => (
                <tr key={o.id}>
                  <td className="font-bold">{o.employee?.full_name}</td>
                  <td className="text-[11px] text-navy-500">{o.employee?.division}</td>
                  <td><Badge variant="gray">{o.employee?.level ?? '–'}</Badge></td>
                  <td className="text-[11px]">{calcYoS(o.employee?.join_date)}</td>
                  <td><Badge variant={o.offboard_type==='Resign'?'red':'blue'}>{o.offboard_type==='End of Contract'?'End OC':o.offboard_type}</Badge></td>
                  <td className="text-[11px] text-navy-500 max-w-[160px]"><span className="line-clamp-1">{o.reason_to_leave ?? '–'}</span></td>
                  <td className="text-[11px] text-navy-500">{fmtDate(o.effective_date)}</td>
                  <td className="text-center"><span className={o.return_assets ? 'text-teal-600 font-bold' : 'text-navy-300'}>{'return_assets' in o ? (o.return_assets ? '✓' : '–') : '–'}</span></td>
                  <td className="text-center"><span className={o.clearance_letter ? 'text-teal-600 font-bold' : 'text-navy-300'}>{o.clearance_letter ? '✓' : '–'}</span></td>
                  <td className="text-center"><span className={o.send_paklaring ? 'text-teal-600 font-bold' : 'text-navy-300'}>{o.send_paklaring ? '✓' : '–'}</span></td>
                </tr>
              ))}
              {!offboarding?.length && <EmptyState message="Belum ada data offboarding" />}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InsightCard title="Early attrition 60% — alarm merah" text="3 dari 5 yang keluar punya tenure di bawah 6 bulan. Sinyal kuat bahwa onboarding experience perlu diperkuat. Rekomendasi: 30-60-90 day formal check-in program." color="bg-red-900/80" titleColor="text-red-300" />
          <InsightCard title="Social Media: turnover tertinggi" text="Berkorelasi dengan engagement score terendah (2.9/5) dan absenteeism 8.2%. Triple concern di satu divisi. Perlu intervensi di level team management dan kompensasi." color="bg-purple-900/70" titleColor="text-purple-300" />
        </div>
      </div>
    </div>
  )
}
