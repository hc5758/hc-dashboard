import { createServiceClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import { KPICard, Badge, InlineBar, InsightCard, EmptyState } from '@/components/ui'
import { fmtDate } from '@/lib/utils'

export default async function AttendancePage() {
  const db = createServiceClient()
  const { data: leave } = await db.from('attendance_leave').select('*, employee:employees(full_name,division)').order('start_date', { ascending: false })

  const approved = (leave ?? []).filter(l => l.status === 'Approved')
  const totalDays = approved.reduce((s, l) => s + l.total_days, 0)
  const byType: Record<string, number> = {}
  approved.forEach(l => { byType[l.leave_type] = (byType[l.leave_type] || 0) + l.total_days })
  const typeData = Object.entries(byType).sort((a, b) => b[1] - a[1])
  const maxType = typeData[0]?.[1] || 1
  const typeColors: Record<string, string> = { Tahunan: 'bg-teal-500', Sakit: 'bg-blue-500', Penting: 'bg-amber-500', Melahirkan: 'bg-purple-500', 'Cuti Bersama': 'bg-navy-600', Unpaid: 'bg-gray-400' }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="Attendance" subtitle="2026" />
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        <div className="grid grid-cols-4 gap-3">
          <KPICard label="Attendance rate"     value="94.2%"      change="vs 92.1% Q1" changeType="up"   accent="bg-teal-400" />
          <KPICard label="Absenteeism rate"    value="5.8%"       change="target <4%"  changeType="down" accent="bg-red-400" />
          <KPICard label="Total absent days"   value={totalDays}  change="YTD 2026"    changeType="flat" accent="bg-amber-400" />
          <KPICard label="Total leave records" value={approved.length}                                   accent="bg-blue-400" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <div className="card-head"><span className="card-title">Leave by type (total hari)</span></div>
            <div className="card-body space-y-2">
              {typeData.map(([type, days]) => (
                <InlineBar key={type} label={type} value={`${days} hari`} pct={Math.round(days / maxType * 100)} color={typeColors[type] ?? 'bg-navy-500'} />
              ))}
            </div>
          </div>
          <div className="card">
            <div className="card-head"><span className="card-title">Absenteeism by division</span></div>
            <div className="card-body space-y-2">
              {[
                { div: 'Social Media', pct: 8.2, col: 'bg-red-500' },
                { div: 'Creative',     pct: 6.4, col: 'bg-amber-500' },
                { div: 'Marketing',    pct: 4.7, col: 'bg-navy-700' },
                { div: 'Finance',      pct: 2.9, col: 'bg-teal-500' },
                { div: 'Hum. Capital', pct: 1.8, col: 'bg-teal-400' },
              ].map(d => <InlineBar key={d.div} label={d.div} value={`${d.pct}%`} pct={d.pct * 10} color={d.col} />)}
            </div>
          </div>
        </div>
        <div className="card overflow-x-auto">
          <div className="card-head"><span className="card-title">Riwayat cuti karyawan</span><Badge variant="teal">{approved.length} records</Badge></div>
          <table className="tbl">
            <thead><tr><th>Karyawan</th><th>Divisi</th><th>Tipe</th><th>Mulai</th><th>Selesai</th><th>Total hari</th><th>Status</th></tr></thead>
            <tbody>
              {(leave ?? []).map(l => (
                <tr key={l.id}>
                  <td className="font-bold">{l.employee?.full_name}</td>
                  <td className="text-[11px] text-navy-400">{l.employee?.division}</td>
                  <td><Badge variant={l.leave_type === 'Sakit' ? 'blue' : l.leave_type === 'Tahunan' ? 'teal' : 'amber'}>{l.leave_type}</Badge></td>
                  <td className="text-[11px] text-navy-400">{fmtDate(l.start_date)}</td>
                  <td className="text-[11px] text-navy-400">{fmtDate(l.end_date)}</td>
                  <td className="font-bold">{l.total_days} hari</td>
                  <td><Badge variant={l.status === 'Approved' ? 'teal' : l.status === 'Rejected' ? 'red' : 'amber'}>{l.status}</Badge></td>
                </tr>
              ))}
              {!leave?.length && <EmptyState message="Belum ada data cuti" />}
            </tbody>
          </table>
        </div>
        <InsightCard title="Social Media absensi tertinggi (8.2%) — berkorelasi dengan engagement rendah" text="Pola ketidakhadiran tertinggi di Social Media bersamaan dengan engagement 2.9/5 dan turnover 14.3%. Perlu program wellbeing dan review beban kerja untuk divisi ini." />
      </div>
    </div>
  )
}
