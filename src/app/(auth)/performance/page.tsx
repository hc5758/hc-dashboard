import { createServiceClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import { KPICard, Badge, InlineBar, InsightCard, EmptyState } from '@/components/ui'
import { fmtDate } from '@/lib/utils'

export default async function PerformancePage() {
  const db = createServiceClient()
  const [{ data: pip }, { data: tna }] = await Promise.all([
    db.from('pip_sp').select('*, employee:employees(full_name,division)').order('issue_date', { ascending: false }),
    db.from('tna_records').select('*').not('score', 'is', null),
  ])

  const avgScore = tna && tna.length > 0
    ? (tna.reduce((s, t) => s + (t.score ?? 0), 0) / tna.length).toFixed(1)
    : '–'

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="Performance" subtitle="Review Q1 2026" />
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="grid grid-cols-4 gap-3">
          <KPICard label="Avg training score" value={avgScore !== '–' ? `${avgScore}/100` : '–'} accent="bg-teal-400" />
          <KPICard label="PIP / SP aktif"      value={pip?.filter(p=>p.status==='Active').length ?? 0}  change="sedang monitoring" changeType="flat" accent="bg-amber-400" />
          <KPICard label="SP selesai"          value={pip?.filter(p=>p.status==='Completed').length ?? 0} accent="bg-teal-400" />
          <KPICard label="Score tertinggi"     value={tna && tna.length > 0 ? `${Math.max(...tna.map(t=>t.score??0))}/100` : '–'} accent="bg-blue-400" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <div className="card-head"><span className="card-title">Avg performance by division (estimasi)</span></div>
            <div className="card-body space-y-2">
              {[
                { div: 'Finance',      score: 4.3, pct: 86 },
                { div: 'Hum. Capital', score: 4.0, pct: 80 },
                { div: 'Creative',     score: 3.8, pct: 76 },
                { div: 'Marketing',    score: 3.6, pct: 72 },
                { div: 'Operations',   score: 3.3, pct: 66 },
                { div: 'Social Media', score: 3.0, pct: 60 },
              ].map(d => (
                <InlineBar key={d.div} label={d.div} value={`${d.score}/5`} pct={d.pct}
                  color={d.pct >= 80 ? 'bg-teal-500' : d.pct >= 70 ? 'bg-navy-700' : 'bg-amber-500'} />
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><span className="card-title">Training score distribution</span></div>
            <div className="card-body space-y-2">
              {tna && tna.length > 0 ? (
                tna.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map(t => (
                  <div key={t.id} className="flex items-center gap-3">
                    <div className="text-[11px] text-navy-600 w-8 text-right font-bold">{t.score}</div>
                    <div className="flex-1 prog-bar"><div className="prog-fill bg-teal-400" style={{width:`${t.score}%`}} /></div>
                    <div className="text-[10px] text-navy-400 w-20 truncate">{t.training_name?.split(' ')[0]}</div>
                  </div>
                ))
              ) : <div className="text-center text-navy-400 text-[11px] py-4">Belum ada data skor</div>}
            </div>
          </div>
        </div>

        <div className="card overflow-x-auto">
          <div className="card-head"><span className="card-title">PIP / SP monitoring</span><button className="btn btn-teal btn-sm">+ Tambah PIP/SP</button></div>
          <table className="tbl">
            <thead><tr><th>Karyawan</th><th>Divisi</th><th>Tipe</th><th>Tgl mulai</th><th>Deadline</th><th>Rencana perbaikan</th><th>Status</th></tr></thead>
            <tbody>
              {(pip ?? []).map(p => (
                <tr key={p.id}>
                  <td className="font-bold">{p.employee?.full_name}</td>
                  <td className="text-[11px] text-navy-500">{p.employee?.division}</td>
                  <td><Badge variant={p.type === 'PIP' ? 'red' : 'amber'}>{p.type}</Badge></td>
                  <td className="text-[11px] text-navy-500">{fmtDate(p.issue_date)}</td>
                  <td className="text-[11px] text-navy-500">{fmtDate(p.end_date)}</td>
                  <td className="text-[11px] text-navy-600 max-w-[200px]"><span className="line-clamp-1">{p.improvement_plan ?? '–'}</span></td>
                  <td><Badge variant={p.status === 'Active' ? 'amber' : p.status === 'Completed' ? 'teal' : 'gray'}>{p.status}</Badge></td>
                </tr>
              ))}
              {!pip?.length && <EmptyState message="Tidak ada PIP/SP aktif" />}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InsightCard title="Finance: top performer (4.3/5)" text="Finance konsisten tertinggi. Opportunity untuk capture best practice tim Finance dan replikasikan ke divisi lain yang performa masih di bawah rata-rata." color="bg-teal-700" titleColor="text-teal-200" />
          <InsightCard title="Social Media: performa terendah (3.0/5)" text="Triple concern: performa rendah + absensi tinggi + turnover tinggi. Intervensi harus menyeluruh — bukan hanya performance review individual." color="bg-amber-700/80" titleColor="text-amber-200" />
        </div>
      </div>
    </div>
  )
}
