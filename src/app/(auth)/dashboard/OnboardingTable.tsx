'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

const SECTIONS = [
  {
    key: 'awal', label: 'Awal', bg: '#1d4ed8', light: 'bg-blue-50', border: 'border-blue-200',
    fields: [
      { key: 'akses',         label: 'Akses' },
      { key: 'hc_onboarding', label: 'HC Onboarding' },
      { key: 'gnowbe',        label: 'Gnowbe' },
    ],
  },
  {
    key: 'perk', label: 'Perkenalan Tim', bg: '#7c3aed', light: 'bg-purple-50', border: 'border-purple-200',
    fields: [
      { key: 'perk_project',      label: 'Project' },
      { key: 'perk_account',      label: 'Account' },
      { key: 'perk_strategist',   label: 'Strategist' },
      { key: 'perk_creative',     label: 'Creative' },
      { key: 'perk_kom',          label: 'KOM' },
      { key: 'perk_data',         label: 'Data' },
      { key: 'perk_finance_bcbs', label: 'Finance & BCBS' },
      { key: 'perk_community',    label: 'Community' },
      { key: 'perk_sosmed',       label: 'Sosial Media' },
    ],
  },
  {
    key: 'probation', label: 'Probation', bg: '#b45309', light: 'bg-amber-50', border: 'border-amber-200',
    fields: [
      { key: 'checkin_1',    label: 'Check-in 1' },
      { key: 'checkin_2',    label: 'Check-in 2' },
      { key: 'checkin_3',    label: 'Check-in 3' },
      { key: 'checkin_4',    label: 'Check-in 4' },
      { key: 'checkin_5',    label: 'Check-in 5' },
      { key: 'final_review', label: 'Final Review' },
    ],
  },
]

const LEGACY: Record<string,string> = {
  akses: 'update_to_structure',
  hc_onboarding: 'send_job_description',
  gnowbe: 'session_1',
  perk_project: 'session_2',
}

const ALL_FIELDS = SECTIONS.flatMap(s => s.fields.map(f => f.key))

function getVal(o: any, field: string) {
  if (o[field] !== undefined) return !!o[field]
  const leg = LEGACY[field]
  return leg ? !!o[leg] : false
}

function Chk({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn('w-6 h-6 rounded-md text-[11px] font-bold inline-flex items-center justify-center border transition-all flex-shrink-0',
        on ? 'bg-teal-500 border-teal-500 text-white' : 'bg-white border-slate-300 text-transparent hover:border-teal-400')}>
      ✓
    </button>
  )
}

export default function OnboardingTable({ onboarding: init }: { onboarding: any[] }) {
  const [data, setData]       = useState(init)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function toggle(id: string, field: string, cur: boolean) {
    const val = !cur
    setData(prev => prev.map(o => o.id === id ? { ...o, [field]: val } : o))
    await fetch('/api/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, [field]: val }),
    })
  }

  if (data.length === 0) return null

  return (
    <div className="card overflow-hidden">
      <div className="card-head">
        <span className="card-title">Onboarding Checklist</span>
        <div className="flex items-center gap-2">
          {SECTIONS.map(s => (
            <div key={s.key} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm" style={{ background: s.bg }} />
              <span className="text-[10.5px] text-slate-500">{s.label}</span>
            </div>
          ))}
          <Badge variant="blue">Q1–Q2 2026</Badge>
        </div>
      </div>

      <table className="tbl">
        <thead>
          <tr>
            <th>Nama</th>
            <th>Divisi</th>
            <th className="text-center">Q</th>
            {SECTIONS.map(s => (
              <th key={s.key} className="text-center" style={{ minWidth: 110 }}>
                <div className="flex items-center justify-center gap-1">
                  <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: s.bg }} />
                  {s.label}
                </div>
              </th>
            ))}
            <th style={{ minWidth: 150 }}>Total Progress</th>
            <th className="text-center w-8"></th>
          </tr>
        </thead>
        <tbody>
          {data.map(o => {
            const isOpen = expanded === o.id
            const totalDone = ALL_FIELDS.filter(f => getVal(o, f)).length
            const totalPct  = Math.round(totalDone / ALL_FIELDS.length * 100)

            return (
              <>
                <tr key={o.id}
                  className={cn('cursor-pointer transition-colors', isOpen ? 'bg-slate-50' : 'hover:bg-slate-50/60')}
                  onClick={() => setExpanded(isOpen ? null : o.id)}>
                  <td>
                    <div className="font-semibold text-[12.5px]">{o.employee?.full_name}</div>
                    <div className="text-[10.5px] text-slate-400 mt-0.5">{o.employee?.position}</div>
                  </td>
                  <td className="text-[12px] text-slate-500">{o.employee?.division}</td>
                  <td className="text-center">
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border',
                      o.quarter==='Q1'?'bg-blue-50 text-blue-600 border-blue-200':'bg-teal-50 text-teal-600 border-teal-200')}>
                      {o.quarter}
                    </span>
                  </td>

                  {/* Mini progress per section */}
                  {SECTIONS.map(s => {
                    const done = s.fields.filter(f => getVal(o, f.key)).length
                    const pct  = Math.round(done / s.fields.length * 100)
                    return (
                      <td key={s.key} className="text-center px-3">
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-[12px] font-semibold" style={{ color: pct === 100 ? '#059669' : pct > 0 ? s.bg : '#94a3b8' }}>
                            {done}/{s.fields.length}
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: pct === 100 ? '#10b981' : s.bg }} />
                          </div>
                          <div className="text-[9.5px] text-slate-400">{pct}%</div>
                        </div>
                      </td>
                    )
                  })}

                  {/* Total progress */}
                  <td className="px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all',
                          totalPct===100?'bg-teal-500':totalPct>60?'bg-blue-500':totalPct>30?'bg-amber-400':'bg-slate-300')}
                          style={{ width: `${totalPct}%` }} />
                      </div>
                      <span className={cn('text-[11px] font-bold w-8 text-right',
                        totalPct===100?'text-teal-600':totalPct>50?'text-blue-600':'text-slate-400')}>
                        {totalPct}%
                      </span>
                    </div>
                    <div className="text-[9.5px] text-slate-400 mt-0.5">{totalDone}/{ALL_FIELDS.length} item</div>
                  </td>

                  <td className="text-center">
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 transition-colors mx-auto',
                      isOpen ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 hover:bg-slate-200')}>
                      {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </div>
                  </td>
                </tr>

                {/* Expanded checklist detail */}
                {isOpen && (
                  <tr key={o.id + '_detail'}>
                    <td colSpan={8} className="p-0 border-b border-slate-100">
                      <div className="bg-slate-50 px-5 py-4">
                        <div className="grid grid-cols-3 gap-4">
                          {SECTIONS.map(s => {
                            const done = s.fields.filter(f => getVal(o, f.key)).length
                            return (
                              <div key={s.key} className={cn('rounded-xl border p-4', s.light, s.border)}>
                                <div className="flex items-center justify-between mb-3">
                                  <div className="text-[12px] font-bold" style={{ color: s.bg }}>{s.label}</div>
                                  <div className="text-[11px] font-semibold text-slate-500">{done}/{s.fields.length}</div>
                                </div>
                                <div className="space-y-2">
                                  {s.fields.map(f => (
                                    <div key={f.key} className="flex items-center gap-2.5"
                                      onClick={e => { e.stopPropagation(); toggle(o.id, f.key, getVal(o, f.key)) }}>
                                      <Chk on={getVal(o, f.key)} onClick={() => toggle(o.id, f.key, getVal(o, f.key))} />
                                      <span className={cn('text-[12px] transition-colors',
                                        getVal(o, f.key) ? 'text-slate-400 line-through' : 'text-slate-700')}>
                                        {f.label}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
