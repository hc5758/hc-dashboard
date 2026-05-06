'use client'
import { useState } from 'react'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

const FIELDS = ['update_to_structure','send_job_description','session_1','session_2','session_3','session_4']
const FIELD_LABELS: Record<string,string> = { update_to_structure:'Struct', send_job_description:'JD', session_1:'S1', session_2:'S2', session_3:'S3', session_4:'S4' }

export default function OnboardingTable({ onboarding: init }: { onboarding: any[] }) {
  const [data, setData] = useState(init)

  async function toggle(id: string, field: string, current: boolean) {
    const newVal = !current
    setData(prev => prev.map(o => o.id === id ? { ...o, [field]: newVal } : o))
    await fetch('/api/onboarding', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, [field]: newVal }),
    })
  }

  if (data.length === 0) return null

  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">Onboarding checklist</span>
        <Badge variant="blue">Q1–Q2 2026</Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="tbl" style={{ minWidth: 750 }}>
          <thead><tr>
            <th>Nama</th><th>Posisi</th><th>Divisi</th><th>Source</th><th>Q</th>
            {FIELDS.map(f => <th key={f} className="text-center">{FIELD_LABELS[f]}</th>)}
            <th>Progress</th>
          </tr></thead>
          <tbody>
            {data.map(o => {
              const done = FIELDS.filter(f => o[f]).length
              const pct  = Math.round(done / FIELDS.length * 100)
              return (
                <tr key={o.id}>
                  <td className="font-bold">{o.employee?.full_name}</td>
                  <td className="text-slate-400 text-[11px]">{o.employee?.position}</td>
                  <td className="text-slate-400 text-[11px]">{o.employee?.division}</td>
                  <td><Badge variant="gray">{o.hiring_source ?? '–'}</Badge></td>
                  <td><Badge variant={o.quarter === 'Q1' ? 'blue' : 'teal'}>{o.quarter}</Badge></td>
                  {FIELDS.map(f => (
                    <td key={f} className="text-center">
                      <button
                        onClick={() => toggle(o.id, f, o[f])}
                        className={cn('w-6 h-6 rounded-md text-[10px] font-bold inline-flex items-center justify-center border transition-all',
                          o[f] ? 'bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-100' : 'bg-gray-50 text-gray-300 border-gray-200 hover:bg-gray-100'
                        )}
                      >
                        {o[f] ? '✓' : '–'}
                      </button>
                    </td>
                  ))}
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 prog-bar">
                        <div className={cn('prog-fill', pct===100?'bg-teal-400':pct>50?'bg-blue-400':'bg-amber-400')} style={{ width:`${pct}%` }}/>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 w-7">{pct}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
