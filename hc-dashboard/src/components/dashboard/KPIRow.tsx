'use client'
import { DashboardStats, Employee, Contract, Recruitment, AttendanceLeave } from '@/types'
import { Users, FileText, Clock, UserMinus, Briefcase } from 'lucide-react'
import { formatDate, daysUntil, getInitials, getAvatarColor } from '@/lib/utils'
import { parseISO } from 'date-fns'

// ─── KPI ROW ─────────────────────────────────────────────────────────────────
export function KPIRow({ stats, employees }: { stats: DashboardStats; employees: Employee[] }) {
  const kpis = [
    { label: 'Total karyawan aktif', value: stats.total_active, sub: '+2 bulan ini',
      color: 'text-teal-700', bg: 'bg-teal-50', icon: Users, iconColor: 'text-teal-700' },
    { label: 'Karyawan tetap PKWTT', value: stats.total_pkwtt, sub: `${stats.total_pkwt} PKWT`,
      color: 'text-blue-700', bg: 'bg-blue-50', icon: FileText, iconColor: 'text-blue-700' },
    { label: 'Avg Years of Service', value: stats.avg_yos, sub: '~2 Thn 3 Bln',
      color: 'text-amber-700', bg: 'bg-amber-50', icon: Clock, iconColor: 'text-amber-700' },
    { label: 'Resign + End OC', value: stats.resign_qtd + stats.end_contract_qtd, sub: 'Q1 2026',
      color: 'text-red-700', bg: 'bg-red-50', icon: UserMinus, iconColor: 'text-red-700' },
    { label: 'Kandidat pipeline', value: stats.open_recruitment, sub: '3 posisi open',
      color: 'text-indigo-700', bg: 'bg-indigo-50', icon: Briefcase, iconColor: 'text-indigo-700' },
  ]
  return (
    <div className="grid grid-cols-5 gap-2.5">
      {kpis.map((k, i) => (
        <div key={i} className="card p-3">
          <div className="flex items-center justify-between mb-2">
            <div className={`${k.bg} w-7 h-7 rounded-lg flex items-center justify-center`}>
              <k.icon size={13} className={k.iconColor} />
            </div>
            <span className={`badge ${k.bg} ${k.color} border-0`}>{k.sub}</span>
          </div>
          <div className={`text-[22px] font-black leading-none ${k.color}`}>{k.value}</div>
          <div className="text-[10px] text-[#5a6a8a] mt-1">{k.label}</div>
        </div>
      ))}
    </div>
  )
}
export default KPIRow

// ─── RECRUITMENT CARD ─────────────────────────────────────────────────────────
export function RecruitmentCard({ recruitment }: { recruitment: Recruitment[] }) {
  const stageTotal = recruitment.reduce((acc, r) => ({
    screening: acc.screening + r.screening_count,
    interview: acc.interview + r.interview_count,
    offering: acc.offering + r.offering_count,
  }), { screening: 0, interview: 0, offering: 0 })

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Recruitment pipeline</span>
        <span className="badge badge-blue">{recruitment.length} posisi open</span>
      </div>
      <div className="divide-y divide-[#f0f3fa]">
        {recruitment.slice(0, 3).map(r => (
          <div key={r.id} className="flex items-center gap-2 px-3 py-2">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-[#0f1e3d] truncate">{r.position}</div>
              <div className="text-[9.5px] text-[#5a6a8a]">{r.division}</div>
            </div>
            <div className="text-right">
              <div className="text-[13px] font-black text-teal-700">{r.total_applicants}</div>
              <div className="text-[9px] text-[#96a4be]">kandidat</div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 bg-[#fafbfe] border-t border-[#e2e8f4]">
        {[
          { label: 'Screening', val: stageTotal.screening, color: 'text-amber-600' },
          { label: 'Interview', val: stageTotal.interview, color: 'text-blue-600' },
          { label: 'Offering', val: stageTotal.offering, color: 'text-teal-600' },
        ].map((s, i) => (
          <div key={i} className="text-center py-2 border-r border-[#e2e8f4] last:border-0">
            <div className={`text-[14px] font-black ${s.color}`}>{s.val}</div>
            <div className="text-[9px] text-[#96a4be]">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── CONTRACT ALERT CARD ──────────────────────────────────────────────────────
export function ContractAlertCard({ contracts }: { contracts: any[] }) {
  const sorted = [...contracts].sort((a, b) =>
    daysUntil(a.end_date) - daysUntil(b.end_date)
  )
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Kontrak habis &lt;30 hr</span>
        <span className="badge badge-red">{contracts.length} orang</span>
      </div>
      <div className="divide-y divide-[#f0f3fa]">
        {sorted.slice(0, 4).map(c => {
          const days = daysUntil(c.end_date)
          const color = days <= 7 ? 'text-red-600' : days <= 14 ? 'text-amber-600' : 'text-teal-600'
          return (
            <div key={c.id} className="flex items-center gap-2.5 px-3 py-2">
              <div className="text-center min-w-[32px]">
                <div className={`text-[18px] font-black leading-none ${color}`}>{days}</div>
                <div className="text-[8.5px] text-[#96a4be]">hari</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#0f1e3d]">{c.employee?.full_name}</div>
                <div className="text-[9.5px] text-[#5a6a8a]">{c.employee?.division} · {c.contract_type}</div>
              </div>
            </div>
          )
        })}
        {contracts.length === 0 && (
          <div className="px-3 py-4 text-center text-[10.5px] text-[#96a4be]">
            Tidak ada kontrak yang akan habis
          </div>
        )}
      </div>
    </div>
  )
}

// ─── BIRTHDAY CARD ────────────────────────────────────────────────────────────
export function BirthdayCard({ employees }: { employees: Employee[] }) {
  const today = new Date()
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Ulang tahun bulan ini</span>
        <span className="badge badge-amber">{employees.length} orang</span>
      </div>
      <div className="divide-y divide-[#f0f3fa]">
        {employees.slice(0, 4).map(e => {
          const bday = parseISO(e.birth_date!)
          const isToday = bday.getDate() === today.getDate()
          return (
            <div key={e.id} className="flex items-center gap-2 px-3 py-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9.5px]
                               font-bold flex-shrink-0 ${getAvatarColor(e.full_name)}`}>
                {getInitials(e.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold text-[#0f1e3d] truncate">{e.full_name}</div>
                <div className="text-[9.5px] text-[#5a6a8a]">{e.division}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-semibold text-[#5a6a8a]">
                  {bday.getDate()} {['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'][bday.getMonth()]}
                </div>
                {isToday && (
                  <span className="text-[8.5px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">
                    Hari ini!
                  </span>
                )}
              </div>
            </div>
          )
        })}
        {employees.length === 0 && (
          <div className="px-3 py-4 text-center text-[10.5px] text-[#96a4be]">
            Tidak ada ulang tahun bulan ini
          </div>
        )}
      </div>
    </div>
  )
}

// ─── LEAVE CARD ───────────────────────────────────────────────────────────────
const leaveColors: Record<string, string> = {
  Tahunan: 'badge-teal', Sakit: 'badge-blue', Penting: 'badge-amber',
  Melahirkan: 'badge-purple', Unpaid: 'badge-gray',
}

export function LeaveCard({ leaves }: { leaves: any[] }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Cuti minggu ini</span>
        <span className="badge badge-gray">{leaves.length} orang</span>
      </div>
      <div className="divide-y divide-[#f0f3fa]">
        {leaves.slice(0, 4).map(l => (
          <div key={l.id} className="flex items-center gap-2 px-3 py-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px]
                             font-bold text-white flex-shrink-0 bg-[#1a8a76]`}>
              {getInitials(l.employee?.full_name || '??')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-[#0f1e3d] truncate">
                {l.employee?.full_name}
              </div>
              <div className="text-[9.5px] text-[#5a6a8a]">
                {formatDate(l.start_date)} – {formatDate(l.end_date)}
              </div>
            </div>
            <span className={`badge ${leaveColors[l.leave_type] || 'badge-gray'}`}>
              {l.leave_type}
            </span>
          </div>
        ))}
        {leaves.length === 0 && (
          <div className="px-3 py-4 text-center text-[10.5px] text-[#96a4be]">
            Tidak ada karyawan cuti saat ini
          </div>
        )}
      </div>
    </div>
  )
}
