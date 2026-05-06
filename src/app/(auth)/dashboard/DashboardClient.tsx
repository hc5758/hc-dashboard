'use client'
import { KPICard, Badge, Avatar, InsightCard, ProgressBar, ChkBtn } from '@/components/ui'
import { fmtDate, daysUntil, calcYoS, calcYoSDecimal, cn } from '@/lib/utils'
import { useState } from 'react'

interface Props {
  employees: any[]
  expiringContracts: any[]
  onboarding: any[]
  offboarding: any[]
  recruitment: any[]
  tnaOverdue: any[]
  pip: any[]
  onLeave: any[]
  birthdays: any[]
  salary: any[]
}

export default function DashboardClient({
  employees, expiringContracts, onboarding, offboarding,
  recruitment, tnaOverdue, pip, onLeave, birthdays, salary
}: Props) {
  const [obData, setObData] = useState(onboarding)

  const avgYoS = employees.length > 0
    ? (employees.reduce((s, e) => s + calcYoSDecimal(e.join_date), 0) / employees.length).toFixed(1)
    : '0'

  const totalSalary = salary.reduce((s: number, r: any) => s + (r.net_salary || 0), 0)

  function toggleOb(id: string, field: string) {
    setObData(prev => prev.map(o => o.id === id ? { ...o, [field]: !o[field] } : o))
    // In production: call PATCH /api/onboarding/[id]
  }

  return (
    <div className="space-y-5">

      {/* Hero */}
      <div className="bg-navy-800 rounded-2xl overflow-hidden grid grid-cols-2 min-h-[140px]">
        <div className="p-6 flex flex-col justify-center">
          <div className="inline-flex items-center gap-1.5 bg-teal-400/12 border border-teal-400/20
                           text-teal-300 text-[10px] font-bold px-3 py-1 rounded-full mb-3 w-fit">
            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full inline-block" />
            HC Analytics · 2026
          </div>
          <h2 className="text-white text-xl font-extrabold leading-tight mb-1.5">
            Halo, <span className="text-teal-300">Admin HC!</span>
          </h2>
          <p className="text-white/40 text-[11px] leading-relaxed mb-4 max-w-xs">
            {expiringContracts.length > 0 && (
              <><strong className="text-white">{expiringContracts.length} kontrak</strong> habis dalam 30 hari. </>
            )}
            {tnaOverdue.length > 0 && (
              <><strong className="text-white">{tnaOverdue.length} TNA</strong> overdue.</>
            )}
          </p>
          <div className="flex gap-2">
            <a href="/recruitment" className="btn btn-teal btn-sm">Pipeline recruitment</a>
            <a href="/workforce"   className="btn btn-ghost btn-sm">Data karyawan</a>
          </div>
        </div>
        <div className="bg-white/[.03] border-l border-white/8 grid grid-cols-3">
          {[
            { n: employees.length, l: 'Total aktif', s: 'semua entitas', c: 'text-teal-300' },
            { n: employees.filter(e => e.employment_type === 'PKWTT').length, l: 'Karyawan tetap', s: 'PKWTT', c: 'text-blue-300' },
            { n: offboarding.filter(o => o.offboard_type === 'Resign').length, l: 'Resign Q2', s: 'keluar', c: 'text-red-300' },
          ].map((s, i) => (
            <div key={i} className="p-5 flex flex-col justify-center border-r border-white/8 last:border-0">
              <div className={`text-3xl font-extrabold leading-none ${s.c}`}>{s.n}</div>
              <div className="text-white/35 text-[10px] mt-1.5">{s.l}</div>
              <div className="text-white/20 text-[9.5px] mt-0.5">{s.s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-5 gap-3">
        <KPICard label="Total headcount" value={employees.length} change="+3 MoM" changeType="up" accent="bg-teal-400" />
        <KPICard label="Avg years of service" value={`${avgYoS} yr`} change="stabil" changeType="flat" accent="bg-amber-400" />
        <KPICard label="Kontrak habis <30hr" value={expiringContracts.length} change={expiringContracts.length > 0 ? 'urgent' : 'aman'} changeType={expiringContracts.length > 0 ? 'down' : 'flat'} accent="bg-red-400" />
        <KPICard label="TNA overdue" value={tnaOverdue.length} change={tnaOverdue.length > 0 ? 'perlu action' : 'aman'} changeType={tnaOverdue.length > 0 ? 'down' : 'flat'} accent="bg-blue-400" />
        <KPICard label="Total payroll Mei" value={`Rp ${Math.round(totalSalary / 1_000_000)} Jt`} change="+4.2% MoM" changeType="up" accent="bg-purple-400" />
      </div>

      {/* 4-card row: hire cards + leave + birthdays */}
      <div className="grid grid-cols-4 gap-3">
        {/* Recruitment mini */}
        <div className="card col-span-2">
          <div className="card-head">
            <span className="card-title">Pipeline recruitment</span>
            <Badge variant="blue">{recruitment.length} posisi open</Badge>
          </div>
          {recruitment.slice(0, 3).map(r => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-navy-50 last:border-0">
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold text-navy-800 truncate">{r.position}</div>
                <div className="text-[10px] text-navy-400">{r.division} · {r.entity}</div>
              </div>
              <div className="text-center">
                <div className="text-base font-extrabold text-teal-600">{r.total_applicants}</div>
                <div className="text-[9px] text-navy-400">kandidat</div>
              </div>
              <Badge variant={r.status === 'Offering' ? 'purple' : 'blue'}>{r.status}</Badge>
            </div>
          ))}
          {recruitment.length === 0 && (
            <div className="px-4 py-5 text-center text-[11px] text-navy-400">Tidak ada posisi terbuka</div>
          )}
        </div>

        {/* Kontrak habis */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Kontrak habis &lt;30hr</span>
            <Badge variant="red">{expiringContracts.length} orang</Badge>
          </div>
          {expiringContracts.slice(0, 4).map(c => {
            const d = daysUntil(c.end_date)
            return (
              <div key={c.id} className="flex items-center gap-2.5 px-4 py-2 border-b border-navy-50 last:border-0">
                <div className="text-center min-w-[30px]">
                  <div className={`text-[17px] font-extrabold leading-none ${d <= 7 ? 'text-red-600' : d <= 14 ? 'text-amber-600' : 'text-teal-600'}`}>{d}</div>
                  <div className="text-[8px] text-navy-400">hari</div>
                </div>
                <div>
                  <div className="text-[11.5px] font-bold text-navy-800">{c.employee?.full_name}</div>
                  <div className="text-[10px] text-navy-400">{c.employee?.division} · {c.contract_type}</div>
                </div>
              </div>
            )
          })}
          {expiringContracts.length === 0 && (
            <div className="px-4 py-5 text-center text-[11px] text-navy-400">Semua kontrak aman</div>
          )}
        </div>

        {/* Cuti + ulang tahun */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Cuti & ultah</span>
          </div>
          {onLeave.slice(0, 2).map(l => (
            <div key={l.id} className="flex items-center gap-2 px-4 py-2 border-b border-navy-50">
              <Avatar name={l.employee?.full_name ?? '?'} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold truncate">{l.employee?.full_name}</div>
                <div className="text-[9.5px] text-navy-400">{fmtDate(l.start_date)} – {fmtDate(l.end_date)}</div>
              </div>
              <Badge variant="teal">{l.leave_type}</Badge>
            </div>
          ))}
          {birthdays.slice(0, 2).map(e => (
            <div key={e.id} className="flex items-center gap-2 px-4 py-2 border-b border-navy-50 last:border-0">
              <Avatar name={e.full_name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-bold truncate">{e.full_name.split(' ').slice(0,2).join(' ')}</div>
                <div className="text-[9.5px] text-navy-400">{e.division}</div>
              </div>
              <span className="text-[10px] font-bold text-amber-600">
                {new Date(e.birth_date!).getDate()} {['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'][new Date(e.birth_date!).getMonth()]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Onboarding checklist */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">Onboarding checklist — karyawan baru</span>
          <Badge variant="blue">Q1–Q2 2026</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th>Nama</th><th>Posisi</th><th>Divisi</th><th>Hiring source</th><th>Q</th>
                <th className="text-center">Struct</th><th className="text-center">JD</th>
                <th className="text-center">S1</th><th className="text-center">S2</th>
                <th className="text-center">S3</th><th className="text-center">S4</th>
              </tr>
            </thead>
            <tbody>
              {obData.map(o => (
                <tr key={o.id}>
                  <td className="font-bold">{o.employee?.full_name}</td>
                  <td className="text-navy-500 text-[11px]">{o.employee?.position}</td>
                  <td className="text-navy-500 text-[11px]">{o.employee?.division}</td>
                  <td><Badge variant="gray">{o.hiring_source ?? '–'}</Badge></td>
                  <td><Badge variant={o.quarter === 'Q1' ? 'blue' : 'teal'}>{o.quarter}</Badge></td>
                  {(['update_to_structure','send_job_description','session_1','session_2','session_3','session_4'] as const).map(f => (
                    <td key={f} className="text-center">
                      <ChkBtn value={o[f]} onChange={() => toggleOb(o.id, f)} />
                    </td>
                  ))}
                </tr>
              ))}
              {obData.length === 0 && <tr><td colSpan={11} className="text-center py-6 text-navy-400">Tidak ada data onboarding</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* PIP aktif */}
      {pip.length > 0 && (
        <div className="card">
          <div className="card-head">
            <span className="card-title">PIP / SP monitoring aktif</span>
            <Badge variant="red">{pip.length} karyawan</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Karyawan</th><th>Divisi</th><th>Tipe</th><th>Mulai</th><th>Deadline</th><th>Rencana perbaikan</th><th>Status</th></tr></thead>
              <tbody>
                {pip.map(p => (
                  <tr key={p.id}>
                    <td className="font-bold">{p.employee?.full_name}</td>
                    <td className="text-navy-500 text-[11px]">{p.employee?.division}</td>
                    <td><Badge variant={p.type === 'PIP' ? 'red' : 'amber'}>{p.type}</Badge></td>
                    <td className="text-navy-500 text-[11px]">{fmtDate(p.issue_date)}</td>
                    <td className="text-navy-500 text-[11px]">{fmtDate(p.end_date)}</td>
                    <td className="text-navy-600 text-[11px] max-w-[200px]">
                      <span className="line-clamp-1">{p.improvement_plan ?? '–'}</span>
                    </td>
                    <td><Badge variant="amber">{p.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="grid grid-cols-3 gap-3">
        <InsightCard
          title="Headcount growth sehat"
          text="Momentum +7.9% MoM driven oleh hiring Creative & Social Media. Target Q2 adalah 45 headcount."
        />
        <InsightCard
          title={`${tnaOverdue.length} TNA overdue — perlu follow up`}
          text="Dewi Rahayu (Excel Advanced) dan Anisa Fitriani (Tax & PPh21) melewati target deadline. Koordinasi dengan masing-masing manager."
          color="bg-amber-700/80"
          titleColor="text-amber-200"
        />
        <InsightCard
          title="Social Media: triple concern"
          text="Turnover 14.3%, engagement terendah (2.9/5), absensi tertinggi (8.2%). Perlu intervensi menyeluruh."
          color="bg-red-900/70"
          titleColor="text-red-300"
        />
      </div>

    </div>
  )
}
