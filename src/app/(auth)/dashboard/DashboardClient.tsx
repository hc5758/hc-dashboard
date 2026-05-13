'use client'
import { useState } from 'react'
import { KPICard, Badge, InsightCard, Avatar } from '@/components/ui'
import { fmtDate, daysUntil, calcYoS, calcYoSDecimal, cn } from '@/lib/utils'

export default function DashboardClient({ employees, contracts, onboarding: initOb, offboarding, recruitment, tna, pip, salary }: {
  employees: any[]; contracts: any[]; onboarding: any[]; offboarding: any[]
  recruitment: any[]; tna: any[]; pip: any[]; salary: any[]
}) {
  const [obData, setObData] = useState(initOb)

  const active = employees.filter(e => e.status === 'active')
  const expiringContracts = contracts.filter(c => { const d = daysUntil(c.end_date); return d >= 0 && d <= 30 })
    .sort((a, b) => daysUntil(a.end_date) - daysUntil(b.end_date))
  const openRec = recruitment.filter(r => ['Open','In Progress','Offering'].includes(r.status))
  const tnaOverdue = tna.filter(t => t.status === 'Overdue')
  const totalSalary = salary.reduce((s, r) => s + (r.net_salary ?? 0), 0)
  const avgYoS = active.length > 0
    ? (active.reduce((s, e) => s + calcYoSDecimal(e.join_date), 0) / active.length).toFixed(1) : '0'

  // Toggle onboarding checklist
  async function toggleOb(id: string, field: string, val: boolean) {
    setObData(prev => prev.map(o => o.id === id ? { ...o, [field]: !o[field] } : o))
    await fetch('/api/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, [field]: !val }),
    })
  }

  const OB_FIELDS = [
    { key: 'update_to_structure', label: 'Struct' },
    { key: 'send_job_description', label: 'JD' },
    { key: 'session_1', label: 'S1' },
    { key: 'session_2', label: 'S2' },
    { key: 'session_3', label: 'S3' },
    { key: 'session_4', label: 'S4' },
  ]

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="bg-[#0f1e3d] rounded-2xl grid grid-cols-2 min-h-[130px]">
        <div className="p-6 flex flex-col justify-center">
          <h2 className="text-white text-xl font-extrabold mb-1">
            Halo, <span className="text-teal-300">Admin HC!</span> 👋
          </h2>
          <p className="text-white/40 text-[11px] leading-relaxed mb-4">
            {expiringContracts.length > 0 && <><strong className="text-white">{expiringContracts.length} kontrak</strong> habis dalam 30 hari. </>}
            {tnaOverdue.length > 0 && <><strong className="text-white">{tnaOverdue.length} TNA</strong> overdue.</>}
            {expiringContracts.length === 0 && tnaOverdue.length === 0 && 'Semua berjalan lancar hari ini. ✓'}
          </p>
          <div className="flex gap-2">
            <a href="/recruitment" className="btn btn-teal btn-sm">Pipeline recruitment</a>
            <a href="/workforce" className="btn btn-ghost btn-sm">Data karyawan</a>
          </div>
        </div>
        <div className="border-l border-white/8 grid grid-cols-3 divide-x divide-white/8">
          {[
            { n: active.length, l: 'Total aktif', s: 'semua entitas', c: 'text-teal-300' },
            { n: active.filter(e => e.employment_type === 'PKWTT').length, l: 'Karyawan tetap', s: 'PKWTT', c: 'text-blue-300' },
            { n: offboarding.filter(o => o.offboard_type === 'Resign').length, l: 'Resign Q2', s: 'keluar', c: 'text-red-300' },
          ].map((s, i) => (
            <div key={i} className="p-5 flex flex-col justify-center">
              <div className={`text-3xl font-extrabold leading-none ${s.c}`}>{s.n}</div>
              <div className="text-white/30 text-[10px] mt-1.5">{s.l}</div>
              <div className="text-white/20 text-[9px] mt-0.5">{s.s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        <KPICard label="Total headcount"      value={active.length}          change="+3 MoM"     changeType="up"   accent="bg-teal-400" />
        <KPICard label="Avg years of service" value={`${avgYoS} yr`}         change="stabil"     changeType="flat" accent="bg-amber-400" />
        <KPICard label="Kontrak habis <30hr"  value={expiringContracts.length} change={expiringContracts.length > 0 ? 'urgent':'aman'} changeType={expiringContracts.length > 0 ? 'down':'flat'} accent="bg-red-400" />
        <KPICard label="TNA overdue"          value={tnaOverdue.length}      change={tnaOverdue.length > 0 ? 'perlu action':'aman'} changeType={tnaOverdue.length > 0 ? 'down':'flat'} accent="bg-blue-400" />
        <KPICard label="Payroll Mei"          value={`Rp ${Math.round(totalSalary/1_000_000)} Jt`} change="+4.2% MoM" changeType="up" accent="bg-purple-400" />
      </div>

      {/* 3-col row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Open recruitment */}
        <div className="col-span-2 card">
          <div className="card-head">
            <span className="card-title">Pipeline recruitment terbuka</span>
            <Badge variant="blue">{openRec.length} posisi</Badge>
          </div>
          {openRec.length === 0
            ? <div className="px-5 py-6 text-center text-[11px] text-slate-300">Tidak ada posisi terbuka</div>
            : openRec.slice(0, 4).map(r => (
              <div key={r.id} className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-bold text-slate-800 truncate">{r.position}</div>
                  <div className="text-[10px] text-slate-300">{r.division} · {r.entity}</div>
                </div>
                <div className="text-center">
                  <div className="text-base font-extrabold text-teal-600">{r.total_applicants}</div>
                  <div className="text-[9px] text-slate-300">kandidat</div>
                </div>
                <Badge variant={r.status === 'Offering' ? 'purple' : 'blue'}>{r.status}</Badge>
              </div>
            ))
          }
        </div>

        {/* Kontrak habis */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Kontrak habis &lt;30hr</span>
            <Badge variant={expiringContracts.length > 0 ? 'red' : 'teal'}>{expiringContracts.length}</Badge>
          </div>
          {expiringContracts.length === 0
            ? <div className="px-5 py-6 text-center text-[11px] text-slate-300">Semua kontrak aman ✓</div>
            : expiringContracts.slice(0, 5).map(c => {
                const d = daysUntil(c.end_date)
                return (
                  <div key={c.id} className="flex items-center gap-2.5 px-4 py-2 border-b border-slate-50 last:border-0">
                    <div className="text-center min-w-[28px]">
                      <div className={`text-[16px] font-extrabold leading-none ${d <= 7 ? 'text-red-600' : d <= 14 ? 'text-amber-600' : 'text-teal-600'}`}>{d}</div>
                      <div className="text-[8px] text-slate-300">hari</div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11.5px] font-bold text-slate-800 truncate">{c.employee?.full_name}</div>
                      <div className="text-[10px] text-slate-300">{c.employee?.division}</div>
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>

      {/* Onboarding checklist — INTERACTIVE */}
      {obData.length > 0 && (
        <div className="card">
          <div className="card-head">
            <span className="card-title">Onboarding checklist</span>
            <div className="flex items-center gap-2">
              <Badge variant="blue">Q1–Q2 2026</Badge>
              <span className="text-[10px] text-slate-300">Klik ✓/– untuk update</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Nama</th><th>Posisi</th><th>Divisi</th><th>Source</th><th>Q</th>
                  {OB_FIELDS.map(f => <th key={f.key} className="text-center">{f.label}</th>)}
                  <th>Progress</th>
                </tr>
              </thead>
              <tbody>
                {obData.map(o => {
                  const done = OB_FIELDS.filter(f => o[f.key]).length
                  const pct  = Math.round(done / OB_FIELDS.length * 100)
                  return (
                    <tr key={o.id}>
                      <td className="font-bold">{o.employee?.full_name}</td>
                      <td className="text-slate-400 text-[11px]">{o.employee?.position}</td>
                      <td className="text-slate-400 text-[11px]">{o.employee?.division}</td>
                      <td><Badge variant="gray">{o.hiring_source ?? '–'}</Badge></td>
                      <td><Badge variant={o.quarter === 'Q1' ? 'blue' : 'teal'}>{o.quarter}</Badge></td>
                      {OB_FIELDS.map(f => (
                        <td key={f.key} className="text-center">
                          <button
                            onClick={() => toggleOb(o.id, f.key, o[f.key])}
                            className={cn(
                              'w-6 h-6 rounded-md border text-[10px] font-bold inline-flex items-center justify-center cursor-pointer transition-all',
                              o[f.key] ? 'bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-100' : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                            )}
                          >
                            {o[f.key] ? '✓' : '–'}
                          </button>
                        </td>
                      ))}
                      <td>
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <div className="flex-1 prog-bar">
                            <div className={cn('prog-fill', pct === 100 ? 'bg-teal-400' : 'bg-blue-400')} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={cn('text-[10px] font-bold', pct === 100 ? 'text-teal-600' : 'text-slate-400')}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PIP aktif */}
      {pip.length > 0 && (
        <div className="card">
          <div className="card-head">
            <span className="card-title">PIP / SP monitoring aktif</span>
            <Badge variant="red">{pip.length} karyawan</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Karyawan</th><th>Divisi</th><th>Tipe</th><th>Mulai</th><th>Deadline</th><th>Rencana</th><th>Status</th></tr></thead>
              <tbody>
                {pip.map(p => (
                  <tr key={p.id}>
                    <td className="font-bold">{p.employee?.full_name}</td>
                    <td className="text-slate-400 text-[11px]">{p.employee?.division}</td>
                    <td><Badge variant={p.type === 'PIP' ? 'red' : 'amber'}>{p.type}</Badge></td>
                    <td className="text-slate-400 text-[11px]">{fmtDate(p.issue_date)}</td>
                    <td className="text-slate-400 text-[11px]">{fmtDate(p.end_date)}</td>
                    <td className="text-slate-600 text-[11px] max-w-[180px]"><span className="line-clamp-1">{p.improvement_plan ?? '–'}</span></td>
                    <td><Badge variant="amber">{p.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    {/* Insights */}
      {(() => {
        // ── Insight 1: Headcount / hiring momentum ─────────────
        const totalActive = active.length
        const recentHires = active.filter(e => {
          const days = (Date.now() - new Date(e.join_date).getTime()) / 86400000
          return days <= 90
        }).length
        const divCounts = active.reduce((acc: any, e) => {
          acc[e.division] = (acc[e.division] || 0) + 1; return acc
        }, {})
        const topHiringDivs = Object.entries(divCounts)
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 2).map(([d]) => d).join(' & ')

        let i1Title = '', i1Text = '', i1Color = '', i1TitleColor = ''
        if (totalActive === 0) {
          i1Title = 'Belum ada data karyawan'
          i1Text  = 'Tambahkan karyawan untuk melihat insight headcount otomatis.'
        } else if (recentHires === 0) {
          i1Title = `${totalActive} karyawan aktif`
          i1Text  = 'Tidak ada hiring baru dalam 90 hari terakhir. Perlu evaluasi pipeline recruitment.'
          i1Color = 'bg-amber-700/80'; i1TitleColor = 'text-amber-200'
        } else {
          i1Title = `${recentHires} hiring baru dalam 90 hari`
          i1Text  = `Momentum hiring terkini didorong oleh ${topHiringDivs}. Total karyawan aktif: ${totalActive}.`
        }

        // ── Insight 2: TNA overdue ─────────────────────────────
        let i2Title = '', i2Text = '', i2Color = 'bg-amber-700/80', i2TitleColor = 'text-amber-200'
        if (tna.length === 0) {
          i2Title = 'Belum ada data TNA'
          i2Text  = 'Data Training Needs Analysis belum diinput. Tambahkan di menu Learning & Dev.'
        } else if (tnaOverdue.length === 0) {
          i2Title = 'Semua TNA on track ✓'
          i2Text  = `${tna.length} program training terpantau, tidak ada yang overdue. Pertahankan!`
          i2Color = 'bg-[#1a2d5a]'; i2TitleColor = 'text-teal-200'
        } else {
          i2Title = `${tnaOverdue.length} TNA overdue`
          i2Text  = 'Perlu koordinasi dengan manager masing-masing untuk akselerasi penyelesaian training yang melewati deadline.'
        }

        // ── Insight 3: Divisi paling berisiko (resign) ─────────
        const resignByDiv = offboarding.reduce((acc: any, o) => {
          const div = o.employee?.division; if (div) acc[div] = (acc[div] || 0) + 1; return acc
        }, {})
        const topResignEntry = Object.entries(resignByDiv).sort((a: any, b: any) => b[1] - a[1])[0]
        const understaffed   = Object.entries(divCounts).sort((a: any, b: any) => (a[1] as number) - (b[1] as number))[0]

        let i3Title = '', i3Text = '', i3Color = '', i3TitleColor = ''
        if (!topResignEntry) {
          i3Title = 'Turnover terkendali ✓'
          i3Text  = `Tidak ada data resign tercatat.${understaffed ? ` Divisi terkecil: ${understaffed[0]} (${understaffed[1]} orang).` : ''}`
        } else {
          const resignDiv   = topResignEntry[0] as string
          const resignCount = topResignEntry[1] as number
          const activeInDiv = divCounts[resignDiv] || 0
          const tRate       = activeInDiv > 0 ? Math.round((resignCount / (resignCount + activeInDiv)) * 100) : 100
          i3Title     = `${resignDiv}: risiko turnover tertinggi`
          i3Text      = `${resignCount} resign dari divisi ini${tRate > 0 ? ` (≈${tRate}% turnover rate)` : ''}. Perlu evaluasi engagement dan workload.`
          i3Color     = tRate >= 20 ? 'bg-red-900/70' : 'bg-amber-700/80'
          i3TitleColor= tRate >= 20 ? 'text-red-300'  : 'text-amber-200'
        }

        return (
          <div className="grid grid-cols-3 gap-3">
            <InsightCard title={i1Title} text={i1Text} color={i1Color||undefined} titleColor={i1TitleColor||undefined}/>
            <InsightCard title={i2Title} text={i2Text} color={i2Color} titleColor={i2TitleColor}/>
            <InsightCard title={i3Title} text={i3Text} color={i3Color||undefined} titleColor={i3TitleColor||undefined}/>
          </div>
        )
      })()}
