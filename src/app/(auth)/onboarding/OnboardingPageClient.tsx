'use client'
import { useState, useMemo } from 'react'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Search, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const SECTIONS = [
  {
    key: 'hc_onboarding', label: '1. HC Onboarding', color: '#1d4ed8',
    light: 'bg-blue-50', border: 'border-blue-200',
    fields: [
      { key: 'hc_dokumen',     label: 'Kelengkapan dokumen' },
      { key: 'hc_akses',       label: 'Pemberian akses sistem' },
      { key: 'hc_jd',          label: 'Penjelasan Job Description' },
      { key: 'hc_benefit',     label: 'Penjelasan benefit & kebijakan' },
      { key: 'hc_tools',       label: 'Setup tools & equipment' },
    ],
  },
  {
    key: 'gnowbe', label: '2. Gnowbe', color: '#0891b2',
    light: 'bg-cyan-50', border: 'border-cyan-200',
    fields: [
      { key: 'gnowbe_reg',     label: 'Registrasi akun Gnowbe' },
      { key: 'gnowbe_module1', label: 'Modul onboarding selesai' },
      { key: 'gnowbe_cert',    label: 'Sertifikat diterima' },
    ],
  },
  {
    key: 'perkenalan', label: '3. Perkenalan Tim', color: '#7c3aed',
    light: 'bg-purple-50', border: 'border-purple-200',
    fields: [
      { key: 'perk_growth',    label: 'Growth & Partnership' },
      { key: 'perk_strategist',label: 'Strategist' },
      { key: 'perk_project',   label: 'Project' },
      { key: 'perk_creative',  label: 'Creative' },
      { key: 'perk_kom',       label: 'KOM' },
      { key: 'perk_sosmed',    label: 'Social Media' },
      { key: 'perk_hc',        label: 'Human Capital' },
      { key: 'perk_finance',   label: 'Finance' },
      { key: 'perk_bcbs',      label: 'Budget & BS' },
      { key: 'perk_data',      label: 'Data' },
      { key: 'perk_community', label: 'Community' },
    ],
  },
  {
    key: 'probation', label: '4. Probation / Contract Plan', color: '#b45309',
    light: 'bg-amber-50', border: 'border-amber-200',
    fields: [
      { key: 'prob_target',    label: 'Target & KPI ditetapkan' },
      { key: 'prob_buddy',     label: 'Buddy / mentor assigned' },
      { key: 'prob_plan',      label: 'Contract plan disetujui' },
    ],
  },
  {
    key: 'checkin', label: '5. Check-in Review (per 2 minggu)', color: '#047857',
    light: 'bg-emerald-50', border: 'border-emerald-200',
    fields: [
      { key: 'checkin_1',      label: 'Check-in Minggu 2' },
      { key: 'checkin_2',      label: 'Check-in Minggu 4' },
      { key: 'checkin_3',      label: 'Check-in Minggu 6' },
      { key: 'checkin_4',      label: 'Check-in Minggu 8' },
      { key: 'checkin_5',      label: 'Check-in Minggu 10' },
      { key: 'checkin_final',  label: 'Final Review' },
    ],
  },
]

const ALL_FIELDS = SECTIONS.flatMap(s => s.fields.map(f => f.key))

function getVal(o: any, field: string) { return !!(o && o[field]) }

function calcProgress(o: any) {
  const done = ALL_FIELDS.filter(f => getVal(o, f)).length
  return { done, total: ALL_FIELDS.length, pct: Math.round(done / ALL_FIELDS.length * 100) }
}

function calcSectionPct(o: any, sec: typeof SECTIONS[0]) {
  const done = sec.fields.filter(f => getVal(o, f.key)).length
  return { done, total: sec.fields.length }
}

function calcYoS(joinDate: string) {
  if (!joinDate) return ''
  const join = new Date(joinDate + 'T00:00:00')
  const now  = new Date()
  const months = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth())
  return months < 1 ? '< 1 bulan' : `${months} bulan`
}

// Onboarding = 1 bulan pertama untuk semua karyawan
function daysLeft(emp: any) {
  const join       = new Date(emp.join_date + 'T00:00:00')
  const onboardEnd = new Date(join)
  onboardEnd.setMonth(onboardEnd.getMonth() + 1)
  return Math.ceil((onboardEnd.getTime() - Date.now()) / 86400000)
}

export default function OnboardingPageClient({ merged }: { merged: any[] }) {
  const [search,   setSearch]   = useState('')
  const [expanded, setExpanded] = useState<string|null>(null)
  const [data,     setData]     = useState(merged)
  const [saving,   setSaving]   = useState<string|null>(null)

  const filtered = useMemo(() =>
    data.filter(m =>
      !search ||
      m.employee.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.employee.division.toLowerCase().includes(search.toLowerCase())
    )
  , [data, search])

  // Stats
  const total     = data.length
  const completed = data.filter(m => calcProgress(m.onboarding).pct === 100).length
  const inProg    = data.filter(m => { const p=calcProgress(m.onboarding).pct; return p>0&&p<100 }).length
  const notStart  = data.filter(m => calcProgress(m.onboarding).pct === 0).length

  async function toggle(empId: string, field: string, current: boolean) {
    // Optimistic update
    setData(prev => prev.map(m =>
      m.employee.id === empId
        ? { ...m, onboarding: { ...(m.onboarding || { employee_id: empId }), [field]: !current } }
        : m
    ))
    setSaving(`${empId}-${field}`)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: empId, [field]: !current }),
      })
      const json = await res.json()
      if (res.ok && json.data) {
        setData(prev => prev.map(m =>
          m.employee.id === empId ? { ...m, onboarding: json.data } : m
        ))
      } else {
        // Revert
        setData(prev => prev.map(m =>
          m.employee.id === empId
            ? { ...m, onboarding: { ...(m.onboarding || { employee_id: empId }), [field]: current } }
            : m
        ))
      }
    } catch {
      setData(prev => prev.map(m =>
        m.employee.id === empId
          ? { ...m, onboarding: { ...(m.onboarding || { employee_id: empId }), [field]: current } }
          : m
      ))
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total karyawan baru', value: total,     accent: 'bg-slate-400' },
          { label: 'Belum mulai',         value: notStart,  accent: 'bg-slate-300' },
          { label: 'Sedang berjalan',     value: inProg,    accent: 'bg-amber-400' },
          { label: 'Selesai',             value: completed, accent: 'bg-teal-500'  },
        ].map(k => (
          <div key={k.label} className="card p-5 flex items-center gap-4">
            <div className={`w-1 self-stretch rounded-full ${k.accent}`}/>
            <div>
              <div className="text-2xl font-bold text-slate-800">{k.value}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 max-w-sm">
        <Search size={14} className="text-slate-300"/>
        <input
          value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Cari nama atau divisi..."
          className="flex-1 text-[13px] outline-none bg-transparent text-slate-700 placeholder-slate-300"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <Users size={32} className="text-slate-200 mx-auto mb-3"/>
          <div className="text-[13px] text-slate-400">Tidak ada karyawan dalam proses onboarding</div>
          <div className="text-[11px] text-slate-300 mt-1">Karyawan baru (join bulan ini) atau yang punya checklist onboarding akan otomatis muncul di sini</div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {filtered.map((m, idx) => {
            const emp      = m.employee
            const ob       = m.onboarding
            const { done, total: tot, pct } = calcProgress(ob)
            const isOpen   = expanded === emp.id
            const dl       = daysLeft(emp)

            return (
              <div key={emp.id} className='border-b border-slate-50 last:border-0'>
                {/* Row */}
                <div
                  className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-slate-50/60 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : emp.id)}
                >
                  {/* Avatar */}
                  <div className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0',
                    pct===100 ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500'
                  )}>
                    {emp.full_name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[12.5px] font-semibold text-slate-800">{emp.full_name}</span>
                      <span className="text-[10px] text-slate-400">{emp.division}</span>
                      <span className={cn('text-[9.5px] font-bold px-2 py-0.5 rounded-full',
                        emp.employment_type==='PKWTT'?'bg-blue-50 text-blue-600':'bg-amber-50 text-amber-600'
                      )}>{emp.employment_type}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[200px]">
                        <div className="h-full rounded-full transition-all"
                          style={{ width:`${pct}%`, background: pct===100?'#10b981':'#2ab89a' }}/>
                      </div>
                      <span className="text-[10px] text-slate-400">{done}/{tot} item</span>
                      <span className="text-[10px] text-slate-300">·</span>
                      <span className="text-[10px] text-slate-400">Join {calcYoS(emp.join_date)} lalu</span>
                    </div>
                  </div>

                  {/* Countdown */}
                  <div className="text-right flex-shrink-0">
                    {pct===100 ? (
                      <div className="text-[11px] font-bold text-teal-500">✓ Selesai</div>
                    ) : dl > 0 ? (
                      <div>
                        <div className={cn('text-[13px] font-bold', dl<=7?'text-red-500':dl<=14?'text-amber-500':'text-slate-600')}>{dl} hari</div>
                        <div className="text-[9.5px] text-slate-400">sisa onboarding</div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400">Bulan pertama selesai</div>
                    )}
                    <div className={cn('text-[10px] font-bold mt-0.5', pct===100?'text-teal-500':pct>=50?'text-amber-500':'text-slate-400')}>{pct}%</div>
                  </div>

                  {isOpen ? <ChevronUp size={13} className="text-slate-300 flex-shrink-0"/> : <ChevronDown size={13} className="text-slate-300 flex-shrink-0"/>}
                </div>

                {/* Expanded checklist */}
                {isOpen && (
                  <div className="px-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SECTIONS.map(sec => {
                      const sp = calcSectionPct(ob, sec)
                      return (
                        <div key={sec.key} className={cn('rounded-xl border p-3.5', sec.border, sec.light)}>
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-[11px] font-bold" style={{color:sec.color}}>{sec.label}</span>
                            <span className="text-[10px] font-semibold" style={{color:sec.color}}>{sp.done}/{sp.total}</span>
                          </div>
                          <div className="space-y-1">
                            {sec.fields.map(f => {
                              const val = getVal(ob, f.key)
                              const isLoading = saving === `${emp.id}-${f.key}`
                              return (
                                <button key={f.key}
                                  disabled={!!isLoading}
                                  onClick={e=>{e.stopPropagation();toggle(emp.id, f.key, val)}}
                                  className={cn(
                                    'w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-lg text-[11.5px] transition-all',
                                    val ? 'bg-white text-slate-700 font-medium' : 'bg-white/50 text-slate-500',
                                    isLoading ? 'opacity-50' : 'hover:bg-white'
                                  )}
                                >
                                  {val
                                    ? <CheckCircle2 size={13} className="flex-shrink-0" style={{color:sec.color}}/>
                                    : <Circle size={13} className="flex-shrink-0 text-slate-300"/>
                                  }
                                  {f.label}
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
      )}
    </div>
  )
}
