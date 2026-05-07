'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

const SECTIONS = [
  {
    key: 'awal',
    label: 'Awal',
    bg: '#1d4ed8',
    light: '#eff6ff',
    fields: [
      { key: 'akses',         label: 'Akses' },
      { key: 'hc_onboarding', label: 'HC Onboarding' },
      { key: 'gnowbe',        label: 'Gnowbe' },
    ],
  },
  {
    key: 'perk',
    label: 'Perkenalan Tim',
    bg: '#7c3aed',
    light: '#f5f3ff',
    fields: [
      { key: 'perkenalan_tim',    label: 'Perkenalan Tim', top: true },
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
    key: 'probation',
    label: 'Probation',
    bg: '#b45309',
    light: '#fffbeb',
    fields: [
      { key: 'probation_plan', label: 'Probation Plan', top: true },
      { key: 'checkin_1',      label: 'Check-in 1' },
      { key: 'checkin_2',      label: 'Check-in 2' },
      { key: 'checkin_3',      label: 'Check-in 3' },
      { key: 'checkin_4',      label: 'Check-in 4' },
      { key: 'checkin_5',      label: 'Check-in 5' },
      { key: 'final_review',   label: 'Final Review', top: true },
    ],
  },
]

const LEGACY: Record<string, string> = {
  akses: 'update_to_structure',
  hc_onboarding: 'send_job_description',
  gnowbe: 'session_1',
  perkenalan_tim: 'session_2',
}

const ALL_FIELDS = SECTIONS.flatMap(s => s.fields.map(f => f.key))

function Chk({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn(
        'w-[22px] h-[22px] rounded border text-[10px] font-bold inline-flex items-center justify-center transition-all',
        on ? 'bg-teal-500 border-teal-500 text-white' : 'bg-white border-slate-300 text-transparent hover:border-teal-400'
      )}>
      ✓
    </button>
  )
}

export default function OnboardingTable({ onboarding: init }: { onboarding: any[] }) {
  const [data, setData] = useState(init)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  function toggleSection(key: string) {
    setCollapsed(p => ({ ...p, [key]: !p[key] }))
  }

  async function toggle(id: string, field: string, cur: boolean) {
    const val = !cur
    setData(prev => prev.map(o => o.id === id ? { ...o, [field]: val } : o))
    await fetch('/api/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, [field]: val }),
    })
  }

  function getVal(o: any, field: string) {
    if (o[field] !== undefined) return !!o[field]
    const leg = LEGACY[field]
    return leg ? !!o[leg] : false
  }

  function sectionPct(o: any, s: typeof SECTIONS[0]) {
    const done = s.fields.filter(f => getVal(o, f.key)).length
    return Math.round(done / s.fields.length * 100)
  }

  if (data.length === 0) return null

  return (
    <div className="card overflow-hidden">
      <div className="card-head">
        <span className="card-title">Onboarding Checklist</span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Klik header section untuk collapse</span>
          <Badge variant="blue">Q1–Q2 2026</Badge>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            {/* Nama + Divisi + Q */}
            <col style={{ width: 160 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 36 }} />
            {/* Sections */}
            {SECTIONS.map(s =>
              collapsed[s.key]
                ? <col key={s.key} style={{ width: 36 }} />
                : s.fields.map(f => <col key={f.key} style={{ width: 50 }} />)
            )}
            {/* Progress */}
            <col style={{ width: 110 }} />
          </colgroup>

          <thead>
            {/* Row 1 — section group headers */}
            <tr>
              <th rowSpan={2} className="px-3 py-2 bg-slate-50 border-b border-r border-slate-200 text-left text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                Nama
              </th>
              <th rowSpan={2} className="px-2 py-2 bg-slate-50 border-b border-r border-slate-200 text-left text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                Divisi
              </th>
              <th rowSpan={2} className="px-1 py-2 bg-slate-50 border-b border-r border-slate-200 text-center text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                Q
              </th>

              {SECTIONS.map(s => (
                <th key={s.key}
                  colSpan={collapsed[s.key] ? 1 : s.fields.length}
                  onClick={() => toggleSection(s.key)}
                  className="border-b border-r border-slate-200 text-center cursor-pointer select-none transition-opacity hover:opacity-80"
                  style={{ background: s.bg, padding: '5px 4px' }}>
                  <div className="flex items-center justify-center gap-1 text-white">
                    {collapsed[s.key]
                      ? <ChevronRight size={12} />
                      : <ChevronLeft size={12} />}
                    <span className="text-[9.5px] font-bold whitespace-nowrap">
                      {collapsed[s.key] ? s.label.slice(0, 3) + '…' : s.label}
                    </span>
                  </div>
                </th>
              ))}

              <th rowSpan={2} className="px-3 py-2 bg-slate-50 border-b border-l border-slate-200 text-left text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                Progress
              </th>
            </tr>

            {/* Row 2 — field labels */}
            <tr>
              {SECTIONS.map(s =>
                collapsed[s.key]
                  ? (
                    <th key={s.key} className="border-b border-r border-slate-100 text-center"
                      style={{ background: s.light }}>
                      <div className="text-[8px] font-semibold text-slate-400 py-1">–</div>
                    </th>
                  )
                  : s.fields.map((f, fi) => (
                    <th key={f.key}
                      className={cn('px-1 py-1.5 border-b border-slate-200 text-center',
                        fi === s.fields.length - 1 ? 'border-r' : '')}
                      style={{ background: s.light }}>
                      <div className={cn('text-[8px] leading-tight whitespace-nowrap',
                        (f as any).top ? 'font-bold text-slate-700' : 'font-medium text-slate-400')}>
                        {f.label}
                      </div>
                    </th>
                  ))
              )}
            </tr>
          </thead>

          <tbody>
            {data.map(o => {
              const totalDone = ALL_FIELDS.filter(f => getVal(o, f)).length
              const totalPct  = Math.round(totalDone / ALL_FIELDS.length * 100)

              return (
                <tr key={o.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  {/* Nama */}
                  <td className="px-3 py-2 border-r border-slate-100">
                    <div className="font-semibold text-[12px] text-slate-800 truncate">{o.employee?.full_name}</div>
                    <div className="text-[9.5px] text-slate-400 truncate mt-0.5">{o.employee?.position}</div>
                  </td>
                  {/* Divisi */}
                  <td className="px-2 py-2 border-r border-slate-100 text-[11px] text-slate-500 truncate">
                    {o.employee?.division}
                  </td>
                  {/* Quarter */}
                  <td className="px-1 py-2 border-r border-slate-100 text-center">
                    <span className={cn('text-[9px] font-bold px-1 py-0.5 rounded border',
                      o.quarter === 'Q1' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-teal-50 text-teal-600 border-teal-200')}>
                      {o.quarter}
                    </span>
                  </td>

                  {/* Sections */}
                  {SECTIONS.map(s =>
                    collapsed[s.key]
                      ? (
                        <td key={s.key} className="text-center border-r border-slate-100 py-2"
                          style={{ background: s.light }}>
                          <div className="text-[10px] font-bold" style={{ color: s.bg }}>
                            {sectionPct(o, s)}%
                          </div>
                        </td>
                      )
                      : s.fields.map((f, fi) => (
                        <td key={f.key}
                          className={cn('text-center py-2',
                            fi === s.fields.length - 1 ? 'border-r border-slate-100' : '',
                            (f as any).top ? 'bg-slate-50/60' : ''
                          )}>
                          <Chk on={getVal(o, f.key)} onClick={() => toggle(o.id, f.key, getVal(o, f.key))} />
                        </td>
                      ))
                  )}

                  {/* Progress */}
                  <td className="px-3 py-2 border-l border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all',
                          totalPct === 100 ? 'bg-teal-500' : totalPct > 66 ? 'bg-blue-500' : totalPct > 33 ? 'bg-amber-400' : 'bg-slate-200')}
                          style={{ width: `${totalPct}%` }} />
                      </div>
                      <span className={cn('text-[10px] font-bold w-7 text-right flex-shrink-0',
                        totalPct === 100 ? 'text-teal-600' : totalPct > 50 ? 'text-blue-600' : 'text-slate-400')}>
                        {totalPct}%
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{totalDone}/{ALL_FIELDS.length}</div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend + collapse hint */}
      <div className="px-5 py-2.5 border-t border-slate-100 flex items-center gap-4 flex-wrap">
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => toggleSection(s.key)}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.bg }} />
            <span className="text-[11px] text-slate-500">
              {s.label} ({s.fields.length})
              {collapsed[s.key] && <span className="text-[10px] text-slate-400 ml-1">— klik untuk buka</span>}
            </span>
          </button>
        ))}
        <span className="text-[10.5px] text-slate-300 ml-auto">Total {ALL_FIELDS.length} item</span>
      </div>
    </div>
  )
}
