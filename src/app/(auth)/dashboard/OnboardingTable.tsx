'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

const SECTIONS = [
  {
    key: 'hc_onboarding',
    label: '1. HC Onboarding',
    color: '#1d4ed8',
    light: 'bg-blue-50',
    border: 'border-blue-200',
    fields: [
      { key: 'hc_dokumen',       label: 'Kelengkapan dokumen' },
      { key: 'hc_akses',         label: 'Pemberian akses sistem' },
      { key: 'hc_jd',            label: 'Penjelasan Job Description' },
      { key: 'hc_benefit',       label: 'Penjelasan benefit & kebijakan' },
      { key: 'hc_tools',         label: 'Setup tools & equipment' },
    ],
  },
  {
    key: 'gnowbe',
    label: '2. Gnowbe',
    color: '#0891b2',
    light: 'bg-cyan-50',
    border: 'border-cyan-200',
    fields: [
      { key: 'gnowbe_reg',       label: 'Registrasi akun Gnowbe' },
      { key: 'gnowbe_module1',   label: 'Modul onboarding selesai' },
      { key: 'gnowbe_cert',      label: 'Sertifikat diterima' },
    ],
  },
  {
    key: 'perkenalan',
    label: '3. Perkenalan Tim',
    color: '#7c3aed',
    light: 'bg-purple-50',
    border: 'border-purple-200',
    fields: [
      { key: 'perk_growth',      label: 'Growth & Partnership' },
      { key: 'perk_strategist',  label: 'Strategist' },
      { key: 'perk_project',     label: 'Project' },
      { key: 'perk_creative',    label: 'Creative' },
      { key: 'perk_kom',         label: 'KOM' },
      { key: 'perk_sosmed',      label: 'Social Media' },
      { key: 'perk_hc',          label: 'Human Capital' },
      { key: 'perk_finance',     label: 'Finance' },
      { key: 'perk_bcbs',        label: 'Budget & BS' },
      { key: 'perk_data',        label: 'Data' },
      { key: 'perk_community',   label: 'Community' },
    ],
  },
  {
    key: 'probation',
    label: '4. Probation/Contract Plan',
    color: '#b45309',
    light: 'bg-amber-50',
    border: 'border-amber-200',
    fields: [
      { key: 'prob_target',      label: 'Target & KPI ditetapkan' },
      { key: 'prob_buddy',       label: 'Buddy/mentor assigned' },
      { key: 'prob_plan',        label: 'Contract plan disetujui' },
    ],
  },
  {
    key: 'checkin',
    label: '5. Check-in Review (per 2 minggu)',
    color: '#047857',
    light: 'bg-emerald-50',
    border: 'border-emerald-200',
    fields: [
      { key: 'checkin_1',        label: 'Check-in Minggu 2' },
      { key: 'checkin_2',        label: 'Check-in Minggu 4' },
      { key: 'checkin_3',        label: 'Check-in Minggu 6' },
      { key: 'checkin_4',        label: 'Check-in Minggu 8' },
      { key: 'checkin_5',        label: 'Check-in Minggu 10' },
      { key: 'checkin_final',    label: 'Final Review' },
    ],
  },
]

const ALL_FIELDS = SECTIONS.flatMap(s => s.fields.map(f => f.key))

function getVal(o: any, field: string) {
  return !!o[field]
}

function calcProgress(o: any) {
  const done = ALL_FIELDS.filter(f => getVal(o, f)).length
  return { done, total: ALL_FIELDS.length, pct: Math.round(done / ALL_FIELDS.length * 100) }
}

function calcSectionProgress(o: any, section: typeof SECTIONS[0]) {
  const done = section.fields.filter(f => getVal(o, f.key)).length
  return { done, total: section.fields.length }
}

export default function OnboardingTable({ onboarding }: { onboarding: any[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  if (!onboarding.length) return (
    <div className="card">
      <div className="card-head"><span className="card-title">Onboarding Checklist</span></div>
      <div className="px-5 py-4 text-[12px] text-slate-400">Tidak ada karyawan dalam proses onboarding.</div>
    </div>
  )

  async function toggle(empId: string, field: string, current: boolean) {
    setSaving(`${empId}-${field}`)
    try {
      await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: empId, [field]: !current }),
      })
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">Onboarding Checklist</span>
        <span className="text-[11px] text-slate-400">{onboarding.length} karyawan</span>
      </div>

      {onboarding.map((o) => {
        const { done, total, pct } = calcProgress(o)
        const isOpen = expanded === o.employee_id
        const name = o.employee?.full_name || '–'
        const div  = o.employee?.division || ''

        return (
          <div key={o.id} className="border-b border-slate-50 last:border-0">
            {/* Row header */}
            <div
              className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-slate-50/70 transition-colors"
              onClick={() => setExpanded(isOpen ? null : o.employee_id)}
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                {name.charAt(0)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] font-semibold text-slate-800 truncate">{name}</span>
                  <span className="text-[10px] text-slate-400 flex-shrink-0">{div}</span>
                </div>
                {/* Progress bar */}
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: pct === 100 ? '#10b981' : '#2ab89a' }}
                    />
                  </div>
                  <span className={cn('text-[10px] font-semibold flex-shrink-0', pct === 100 ? 'text-emerald-600' : 'text-slate-400')}>
                    {done}/{total}
                  </span>
                </div>
              </div>

              <div className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0',
                pct === 100 ? 'bg-emerald-50 text-emerald-600' : pct >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'
              )}>
                {pct}%
              </div>

              {isOpen ? <ChevronUp size={14} className="text-slate-300 flex-shrink-0"/> : <ChevronDown size={14} className="text-slate-300 flex-shrink-0"/>}
            </div>

            {/* Expanded checklist */}
            {isOpen && (
              <div className="px-5 pb-4 grid grid-cols-1 gap-3">
                {SECTIONS.map(sec => {
                  const sp = calcSectionProgress(o, sec)
                  return (
                    <div key={sec.key} className={cn('rounded-xl border p-3', sec.border, sec.light)}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold" style={{ color: sec.color }}>{sec.label}</span>
                        <span className="text-[10px] font-semibold" style={{ color: sec.color }}>{sp.done}/{sp.total}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {sec.fields.map(f => {
                          const val = getVal(o, f.key)
                          const isLoading = saving === `${o.employee_id}-${f.key}`
                          return (
                            <button
                              key={f.key}
                              disabled={!!isLoading}
                              onClick={() => toggle(o.employee_id, f.key, val)}
                              className={cn(
                                'flex items-center gap-2 text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-all',
                                val ? 'bg-white/80 text-slate-700' : 'bg-white/40 text-slate-500',
                                isLoading ? 'opacity-50' : 'hover:bg-white'
                              )}
                            >
                              {val
                                ? <CheckCircle2 size={13} className="flex-shrink-0" style={{ color: sec.color }}/>
                                : <Circle size={13} className="flex-shrink-0 text-slate-300"/>
                              }
                              <span className={val ? 'font-medium' : ''}>{f.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
