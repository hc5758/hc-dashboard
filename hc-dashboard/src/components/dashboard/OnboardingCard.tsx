'use client'
import { Onboarding, TNARecord, Employee, Offboarding } from '@/types'
import { formatDate, getInitials, getAvatarColor } from '@/lib/utils'
import { Check, X, Minus, Clock, TrendingDown } from 'lucide-react'

// ─── ONBOARDING CARD ──────────────────────────────────────────────────────────
function CheckIcon({ val }: { val: boolean | null }) {
  if (val === true) return <span className="chk bg-teal-50 text-teal-700 border border-teal-200 w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold">✓</span>
  if (val === false) return <span className="chk bg-gray-100 text-gray-400 w-5 h-5 rounded flex items-center justify-center text-[9px]">–</span>
  return <span className="chk bg-amber-50 text-amber-700 w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold">~</span>
}

export function OnboardingCard({ onboarding }: { onboarding: any[] }) {
  const recent = onboarding.filter(o => !o.is_completed).slice(0, 4)
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Onboarding checklist — karyawan baru</span>
        <span className="badge badge-blue">Q1–Q2 2026</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th className="table-th w-[130px]">Nama</th>
              <th className="table-th w-[80px]">Divisi</th>
              <th className="table-th w-[45px] text-center">Q</th>
              <th className="table-th w-[50px] text-center">Struct</th>
              <th className="table-th w-[50px] text-center">JD</th>
              <th className="table-th w-[40px] text-center">S1</th>
              <th className="table-th w-[40px] text-center">S2</th>
              <th className="table-th w-[40px] text-center">S3</th>
              <th className="table-th w-[40px] text-center">S4</th>
            </tr>
          </thead>
          <tbody>
            {recent.map(o => (
              <tr key={o.id} className="hover:bg-[#fafbfe]">
                <td className="table-td font-medium truncate">{o.employee?.full_name}</td>
                <td className="table-td text-[#5a6a8a] truncate">{o.employee?.division}</td>
                <td className="table-td text-center">
                  <span className={`badge text-center ${o.quarter === 'Q1' ? 'badge-blue' : 'badge-teal'}`}>
                    {o.quarter}
                  </span>
                </td>
                <td className="table-td text-center"><CheckIcon val={o.update_to_structure} /></td>
                <td className="table-td text-center"><CheckIcon val={o.send_job_description} /></td>
                <td className="table-td text-center"><CheckIcon val={o.session_1} /></td>
                <td className="table-td text-center"><CheckIcon val={o.session_2} /></td>
                <td className="table-td text-center"><CheckIcon val={o.session_3} /></td>
                <td className="table-td text-center"><CheckIcon val={o.session_4} /></td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr><td colSpan={9} className="table-td text-center text-[#96a4be] py-4">Tidak ada data onboarding aktif</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default OnboardingCard

// ─── ACTIVITY CARD ────────────────────────────────────────────────────────────
export function ActivityCard({ offboarding, tnaOverdue, expiringContracts }: {
  offboarding: any[]; tnaOverdue: any[]; expiringContracts: any[]
}) {
  const activities = [
    ...offboarding.slice(0, 2).map(o => ({
      color: 'bg-red-400',
      text: `${o.employee?.full_name} — ${o.offboard_type.toLowerCase()} diajukan`,
      meta: `${formatDate(o.report_date)} · ${o.pic?.full_name || 'HC'}`,
    })),
    ...tnaOverdue.slice(0, 2).map(t => ({
      color: 'bg-amber-400',
      text: `TNA ${t.employee?.full_name} overdue — ${t.training_name}`,
      meta: 'Auto-alert · Sistem',
    })),
    ...expiringContracts.slice(0, 2).map(c => ({
      color: 'bg-blue-400',
      text: `Kontrak ${c.employee?.full_name} — ${Math.max(0, Math.ceil((new Date(c.end_date).getTime() - Date.now()) / 86400000))} hari lagi berakhir`,
      meta: 'Auto-alert · Sistem',
    })),
  ]

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Aktivitas terkini</span>
        <span className="text-[9.5px] text-[#96a4be]">Hari ini</span>
      </div>
      <div className="divide-y divide-[#f0f3fa]">
        {activities.slice(0, 6).map((a, i) => (
          <div key={i} className="flex items-start gap-2.5 px-3 py-2">
            <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${a.color}`}></div>
            <div>
              <div className="text-[11px] text-[#0f1e3d] leading-tight">{a.text}</div>
              <div className="text-[9.5px] text-[#96a4be] mt-0.5">{a.meta}</div>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="px-3 py-4 text-center text-[10.5px] text-[#96a4be]">Tidak ada aktivitas terkini</div>
        )}
      </div>
    </div>
  )
}

// ─── TNA PROGRESS CARD ────────────────────────────────────────────────────────
export function TNAProgressCard({ tnaRecords, employees }: { tnaRecords: TNARecord[]; employees: Employee[] }) {
  const progressByEmployee = employees.slice(0, 6).map(e => {
    const empTNA = tnaRecords.filter(t => t.employee_id === e.id)
    const total = empTNA.length
    const done = empTNA.filter(t => t.status === 'Done').length
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    const hasOverdue = empTNA.some(t => t.status === 'Overdue')
    return { employee: e, total, done, pct, hasOverdue }
  }).filter(p => p.total > 0)

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">TNA progress</span>
        <span className="badge badge-teal">2026</span>
      </div>
      <div className="px-3 py-2 space-y-2.5">
        {progressByEmployee.slice(0, 5).map(p => (
          <div key={p.employee.id}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] text-[#0f1e3d]">{p.employee.full_name.split(' ')[0]} {p.employee.full_name.split(' ')[1]?.[0]}.</span>
              <span className={`text-[10.5px] font-bold ${p.hasOverdue ? 'text-red-600' : p.pct >= 80 ? 'text-teal-700' : p.pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                {p.pct}%
              </span>
            </div>
            <div className="h-1.5 bg-[#f0f3fa] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${p.hasOverdue ? 'bg-red-400' : p.pct >= 80 ? 'bg-teal-500' : 'bg-amber-400'}`}
                style={{ width: `${p.pct}%` }}
              />
            </div>
          </div>
        ))}
        {progressByEmployee.length === 0 && (
          <div className="text-center text-[10.5px] text-[#96a4be] py-3">Belum ada data TNA</div>
        )}
      </div>
    </div>
  )
}

// ─── OFFBOARD SUMMARY ─────────────────────────────────────────────────────────
export function OffboardSummaryCard({ offboarding }: { offboarding: any[] }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Rekap keluar Q1</span>
        <span className="badge badge-red">{offboarding.length} orang</span>
      </div>
      <table className="w-full" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th className="table-th">Nama</th>
            <th className="table-th w-[70px]">Tipe</th>
            <th className="table-th w-[55px] text-center">Clear</th>
          </tr>
        </thead>
        <tbody>
          {offboarding.slice(0, 5).map(o => (
            <tr key={o.id} className="hover:bg-[#fafbfe]">
              <td className="table-td truncate">{o.employee?.full_name?.split(' ').slice(0, 2).join(' ')}</td>
              <td className="table-td">
                <span className={`badge ${o.offboard_type === 'Resign' ? 'badge-red' : 'badge-blue'}`}>
                  {o.offboard_type === 'End of Contract' ? 'End OC' : o.offboard_type}
                </span>
              </td>
              <td className="table-td text-center">
                {o.clearance_letter
                  ? <span className="text-teal-600 font-bold text-[10px]">✓</span>
                  : <span className="text-gray-400 text-[10px]">–</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── GENDER DONUT ─────────────────────────────────────────────────────────────
export function GenderDonutCard({ employees }: { employees: Employee[] }) {
  const female = employees.filter(e => e.gender === 'Perempuan' && e.status === 'active').length
  const male = employees.filter(e => e.gender === 'Laki-laki' && e.status === 'active').length
  const total = female + male
  const femalePct = total > 0 ? Math.round((female / total) * 100) : 0
  const r = 28
  const circ = 2 * Math.PI * r
  const femaleDash = (femalePct / 100) * circ
  return (
    <div className="card p-3">
      <div className="text-[11.5px] font-bold text-[#0f1e3d] mb-3">Distribusi gender</div>
      <div className="flex items-center gap-3">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="#eef1f8" strokeWidth="12" />
          <circle cx="36" cy="36" r={r} fill="none" stroke="#2ab89a" strokeWidth="12"
            strokeDasharray={`${femaleDash} ${circ - femaleDash}`}
            strokeDashoffset={circ * 0.25} strokeLinecap="round" />
          <circle cx="36" cy="36" r={r} fill="none" stroke="#0f1e3d" strokeWidth="12"
            strokeDasharray={`${circ - femaleDash} ${femaleDash}`}
            strokeDashoffset={circ * 0.25 - femaleDash} strokeLinecap="round" />
          <text x="36" y="33" textAnchor="middle" fontSize="9" fill="#96a4be">Total</text>
          <text x="36" y="44" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0f1e3d">{total}</text>
        </svg>
        <div className="space-y-1.5 text-[10.5px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-500 inline-block"></span>
            <span className="text-[#0f1e3d]">Perempuan</span>
            <span className="font-bold text-[#0f1e3d] ml-auto pl-2">{female}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0f1e3d] inline-block"></span>
            <span className="text-[#0f1e3d]">Laki-laki</span>
            <span className="font-bold text-[#0f1e3d] ml-auto pl-2">{male}</span>
          </div>
          <div className="pt-1 border-t border-[#e2e8f4]">
            <div className="text-[9px] text-[#96a4be] mb-1">{femalePct}% vs {100 - femalePct}%</div>
            <div className="h-1.5 bg-[#eef1f8] rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${femalePct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SALARY BAR ───────────────────────────────────────────────────────────────
export function SalaryBarCard({ salaryRecords }: { salaryRecords: any[] }) {
  const byDiv: Record<string, number> = {}
  salaryRecords.forEach(s => {
    const div = s.employee?.division || 'Others'
    byDiv[div] = (byDiv[div] || 0) + s.net_salary
  })
  const sorted = Object.entries(byDiv).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const max = sorted[0]?.[1] || 1

  return (
    <div className="card p-3">
      <div className="text-[11.5px] font-bold text-[#0f1e3d] mb-3">Salary cost per divisi</div>
      <div className="space-y-2">
        {sorted.map(([div, amount], i) => {
          const pct = Math.round((amount / max) * 100)
          const colors = ['bg-[#0f1e3d]', 'bg-[#1a2d5a]', 'bg-teal-600', 'bg-teal-500', 'bg-blue-400']
          return (
            <div key={div} className="flex items-center gap-2">
              <span className="text-[9.5px] text-[#5a6a8a] w-[70px] text-right flex-shrink-0 truncate">{div}</span>
              <div className="flex-1 h-4 bg-[#f0f3fa] rounded overflow-hidden">
                <div className={`h-full ${colors[i]} rounded flex items-center pl-1.5`}
                     style={{ width: `${pct}%`, minWidth: '20px' }}>
                  <span className="text-[9px] font-bold text-white">{pct}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── TURNOVER CARD ────────────────────────────────────────────────────────────
export function TurnoverCard({ offboarding }: { offboarding: any[] }) {
  return <div className="card p-3">
    <div className="text-[11.5px] font-bold text-[#0f1e3d] mb-2">Turnover Q1 2026</div>
    <div className="flex gap-3">
      {[
        { label: 'Turnover rate', val: '6.8%', color: 'text-red-600' },
        { label: 'Resign YTD', val: offboarding.filter(o => o.offboard_type === 'Resign').length, color: 'text-[#0f1e3d]' },
        { label: 'End OC YTD', val: offboarding.filter(o => o.offboard_type === 'End of Contract').length, color: 'text-blue-600' },
      ].map((s, i) => (
        <div key={i} className="flex-1 text-center bg-[#fafbfe] rounded-lg p-2">
          <div className={`text-[18px] font-black ${s.color}`}>{s.val}</div>
          <div className="text-[9px] text-[#96a4be] mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  </div>
}
