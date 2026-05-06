import { createServiceClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import { KPICard, Badge, InlineBar, InsightCard, EmptyState } from '@/components/ui'
import { fmtCurrency, fmtCurrencyShort, cn } from '@/lib/utils'

export default async function PayrollPage() {
  const db = createServiceClient()
  const { data: salary } = await db.from('salary_records')
    .select('*, employee:employees(full_name,division,employment_type)')
    .eq('year', 2026).eq('month', 5)
    .order('net_salary', { ascending: false })

  const totalNet = salary?.reduce((s, r) => s + (r.net_salary ?? 0), 0) ?? 0
  const totalBasic = salary?.reduce((s, r) => s + r.basic_salary, 0) ?? 0
  const avgSalary = salary && salary.length > 0 ? Math.round(totalNet / salary.length) : 0
  const unpaid = salary?.filter(r => !r.is_paid) ?? []

  const byDiv = (salary ?? []).reduce((acc: any, r) => {
    const d = r.employee?.division ?? 'Unknown'
    acc[d] = (acc[d] || 0) + (r.net_salary ?? 0); return acc
  }, {})
  const divData = Object.entries(byDiv).sort((a: any, b: any) => b[1] - a[1])
  const maxDiv = divData[0]?.[1] as number || 1

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="Payroll Overview" subtitle="Mei 2026" />
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        <div className="grid grid-cols-4 gap-3">
          <KPICard label="Total payroll Mei" value={fmtCurrencyShort(totalNet)} change="+4.2% MoM" changeType="up"   accent="bg-teal-400" />
          <KPICard label="Avg salary"        value={fmtCurrencyShort(avgSalary)} change="per karyawan" changeType="flat" accent="bg-blue-400" />
          <KPICard label="Belum dibayar"     value={unpaid.length}              change={unpaid.length > 0 ? 'perlu action' : 'semua lunas'} changeType={unpaid.length > 0 ? 'down' : 'flat'} accent="bg-amber-400" />
          <KPICard label="Payroll growth YoY" value="+12.3%"                    change="in line HC"   changeType="up"   accent="bg-purple-400" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="card">
            <div className="card-head"><span className="card-title">Payroll by division</span></div>
            <div className="card-body space-y-2">
              {divData.map(([div, total]) => (
                <InlineBar key={div} label={div as string}
                  value={fmtCurrencyShort(total as number)}
                  pct={Math.round((total as number / maxDiv) * 100)}
                  color="bg-navy-800" />
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><span className="card-title">Payroll summary Mei 2026</span></div>
            <div className="card-body">
              {[
                { label: 'Total gaji pokok', val: totalBasic },
                { label: 'Total tunjangan', val: salary?.reduce((s,r)=>s+r.allowance,0)??0 },
                { label: 'Total lembur', val: salary?.reduce((s,r)=>s+r.overtime,0)??0 },
                { label: 'Total bonus', val: salary?.reduce((s,r)=>s+r.bonus,0)??0 },
                { label: 'Total potongan BPJS', val: salary?.reduce((s,r)=>s+r.bpjs_ketenagakerjaan+r.bpjs_kesehatan,0)??0 },
              ].map(r => (
                <div key={r.label} className="flex justify-between items-center py-2 border-b border-navy-50 last:border-0">
                  <span className="text-[11.5px] text-navy-500">{r.label}</span>
                  <span className="text-[12px] font-bold text-navy-800">{fmtCurrencyShort(r.val)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 border-t border-navy-200 mt-1">
                <span className="text-[12px] font-bold text-navy-800">Total take home pay</span>
                <span className="text-[14px] font-extrabold text-teal-600">{fmtCurrencyShort(totalNet)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card overflow-x-auto">
          <div className="card-head">
            <span className="card-title">Detail salary karyawan — Mei 2026</span>
            <div className="flex items-center gap-2">
              <Badge variant="teal">{(salary?.filter(r=>r.is_paid)??[]).length} lunas</Badge>
              {unpaid.length > 0 && <Badge variant="red">{unpaid.length} belum</Badge>}
            </div>
          </div>
          <table className="tbl">
            <thead><tr><th>Karyawan</th><th>Divisi</th><th>Gaji pokok</th><th>Tunjangan</th><th>Lembur</th><th>Bonus</th><th>Potongan</th><th>Take home</th><th>Status</th></tr></thead>
            <tbody>
              {(salary ?? []).map(s => (
                <tr key={s.id}>
                  <td className="font-bold">{s.employee?.full_name}</td>
                  <td className="text-[11px] text-navy-500">{s.employee?.division}</td>
                  <td className="text-[11.5px]">{fmtCurrencyShort(s.basic_salary)}</td>
                  <td className="text-[11.5px]">{fmtCurrencyShort(s.allowance)}</td>
                  <td className="text-[11.5px]">{fmtCurrencyShort(s.overtime)}</td>
                  <td className="text-[11.5px]">{fmtCurrencyShort(s.bonus)}</td>
                  <td className="text-[11.5px] text-red-600">{fmtCurrencyShort(s.bpjs_ketenagakerjaan + s.bpjs_kesehatan + s.pph21)}</td>
                  <td className="font-extrabold text-teal-600">{fmtCurrencyShort(s.net_salary)}</td>
                  <td><Badge variant={s.is_paid ? 'teal' : 'red'}>{s.is_paid ? 'Lunas' : 'Belum'}</Badge></td>
                </tr>
              ))}
              {!salary?.length && <EmptyState message="Belum ada data salary bulan ini" />}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InsightCard title="Payroll +4.2% MoM — in line dengan HC growth" text="Kenaikan payroll sebanding dengan pertumbuhan headcount (+7.9% MoM). Cost per head justru turun dari Rp 8.1 Jt ke Rp 7.6 Jt — tanda hiring dilakukan di level yang lebih junior. Positif untuk efisiensi." />
          <InsightCard title="Operations: cost per head tertinggi" text="4 karyawan senior di Operations menghasilkan cost per head tertinggi. Perlu evaluasi apakah ROI-nya sebanding dengan output aktual dan kontribusi ke revenue." color="bg-blue-900/70" titleColor="text-blue-300" />
        </div>
      </div>
    </div>
  )
}
