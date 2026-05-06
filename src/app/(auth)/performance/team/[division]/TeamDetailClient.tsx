'use client'
import { useState } from 'react'
import { ArrowLeft, ExternalLink, Plus, Pencil, ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Badge, Avatar, ProgressBar, EmptyState } from '@/components/ui'
import { fmtDate, calcYoS, cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

const QUARTERS = ['Q1','Q2','Q3','Q4','Full Year']
const YEARS = [2026, 2025, 2024]
const EMPTY_SCORE = { employee_id:'', year:2026, quarter:'Q1', score:'', csat_score:'', kpi_score:'', csat_link:'', kpi_link:'', pic_name:'', notes:'' }

export default function TeamDetailClient({ division, employees, pip, tna }: { division:string; employees:any[]; pip:any[]; tna:any[] }) {
  const router = useRouter()
  const [scores, setScores] = useState<any[]>([])
  const [selectedYear, setSelectedYear] = useState(2026)
  const [selectedQ, setSelectedQ] = useState('Q1')
  const [showModal, setShowModal] = useState(false)
  const [editScoreId, setEditScoreId] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>(EMPTY_SCORE)
  const [expanded, setExpanded] = useState<string|null>(null)
  const [loaded, setLoaded] = useState(false)
  const fv = (k:string,v:any) => setForm((p:any)=>({...p,[k]:v}))

  const teamPip = pip.filter(p=>employees.some(e=>e.id===p.employee_id))
  const teamTna = tna.filter(t=>employees.some(e=>e.id===t.employee_id))

  async function loadScores(year:number,q:string) {
    setSelectedYear(year); setSelectedQ(q); setLoaded(false)
    const res = await fetch(`/api/performance-scores?year=${year}`)
    const data = await res.json()
    const divScores = (data.data??[]).filter((s:any)=>employees.some(e=>e.id===s.employee_id)&&s.quarter===q)
    setScores(divScores); setLoaded(true)
  }

  function getScore(empId:string) { return scores.find(s=>s.employee_id===empId) }

  function openAdd(empId?:string) {
    setForm({...EMPTY_SCORE, employee_id:empId||'', year:selectedYear, quarter:selectedQ})
    setEditScoreId(null); setShowModal(true)
  }
  function openEdit(s:any) {
    setForm({ employee_id:s.employee_id, year:s.year, quarter:s.quarter, score:s.score,
      csat_score:s.csat_score||'', kpi_score:s.kpi_score||'',
      csat_link:s.csat_link||'', kpi_link:s.kpi_link||'', pic_name:s.pic_name||'', notes:s.notes||'' })
    setEditScoreId(s.id); setShowModal(true)
  }

  async function save() {
    if (!form.employee_id||!form.score) { alert('Pilih karyawan dan isi score'); return }
    setSaving(true)
    try {
      const payload = {...form, score: parseFloat(form.score)}
      if (editScoreId) {
        const res=await fetch('/api/performance-scores',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editScoreId,...payload})})
        const data=await res.json(); if(!res.ok)throw new Error(data.error)
        setScores(prev=>prev.map(s=>s.id===editScoreId?{...data.data,employee:employees.find(e=>e.id===payload.employee_id)}:s))
      } else {
        const res=await fetch('/api/performance-scores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
        const data=await res.json(); if(!res.ok)throw new Error(data.error)
        setScores(prev=>[{...data.data,employee:employees.find(e=>e.id===payload.employee_id)},...prev])
      }
      setShowModal(false)
    } catch(err:any){alert('Error: '+err.message)}
    setSaving(false)
  }

  const avgScore = scores.length>0 ? Math.round(scores.reduce((s,sc)=>s+parseFloat(sc.score),0)/scores.length) : null

  return(
    <div className="space-y-5">
      <button onClick={()=>router.push('/performance')} className="flex items-center gap-2 text-[12.5px] text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft size={15}/> Kembali ke Performance
      </button>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-lg">{employees.length}</div><div><div className="text-[11px] text-slate-400">Total anggota</div><div className="text-[13px] font-semibold">{division}</div></div></div>
        <div className="card p-4 flex items-center gap-3"><div className={cn('w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg',avgScore?(avgScore>=85?'bg-teal-50 text-teal-600':avgScore>=70?'bg-amber-50 text-amber-500':'bg-red-50 text-red-500'):'bg-slate-100 text-slate-400')}>{avgScore??'–'}</div><div><div className="text-[11px] text-slate-400">Avg score tim</div><div className="text-[13px] font-semibold">{selectedQ} {selectedYear}</div></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 font-bold text-lg">{teamPip.filter(p=>p.status==='Active').length}</div><div><div className="text-[11px] text-slate-400">PIP/SP aktif</div><div className="text-[13px] font-semibold">dalam tim</div></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-lg">{teamTna.filter(t=>t.status==='Done').length}</div><div><div className="text-[11px] text-slate-400">Training selesai</div><div className="text-[13px] font-semibold">YTD 2026</div></div></div>
      </div>

      {/* Filter tahun + quarter */}
      <div className="card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <div className="text-[11px] text-slate-400 mb-1.5 font-medium">Tahun</div>
            <div className="flex gap-2">
              {YEARS.map(y=>(
                <button key={y} onClick={()=>loadScores(y,selectedQ)}
                  className={cn('px-3.5 py-1.5 rounded-lg text-[12px] font-semibold border transition-all',
                    selectedYear===y?'bg-[#0f1e3d] text-white border-[#0f1e3d]':'bg-white text-slate-500 border-slate-200 hover:border-slate-400')}>
                  {y}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400 mb-1.5 font-medium">Quarter / Period</div>
            <div className="flex gap-2">
              {QUARTERS.map(q=>(
                <button key={q} onClick={()=>loadScores(selectedYear,q)}
                  className={cn('px-3.5 py-1.5 rounded-lg text-[12px] font-semibold border transition-all',
                    selectedQ===q?'bg-[#2ab89a] text-white border-[#2ab89a]':'bg-white text-slate-500 border-slate-200 hover:border-slate-400')}>
                  {q}
                </button>
              ))}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {!loaded&&<span className="text-[12px] text-slate-400">Klik tahun/quarter untuk load data</span>}
            <button onClick={()=>openAdd()} className="btn btn-teal btn-sm"><Plus size={12}/> Input score</button>
          </div>
        </div>
      </div>

      {/* Team table */}
      <div className="card overflow-x-auto">
        <div className="card-head">
          <span className="card-title">Anggota tim — {division} · {selectedQ} {selectedYear}</span>
          <Badge variant="gray">{employees.length} orang</Badge>
        </div>
        <table className="tbl" style={{minWidth:900}}>
          <thead><tr><th>Nama</th><th>Posisi</th><th>Masa kerja</th><th className="text-center">Score {selectedQ} {selectedYear}</th><th className="text-center">Form CSAT</th><th className="text-center">Form KPI</th><th>PIC</th><th>Status</th><th className="text-center">Aksi</th></tr></thead>
          <tbody>
            {employees.map(emp=>{
              const sc = getScore(emp.id)
              const empPip = teamPip.filter(p=>p.employee_id===emp.id)
              return(
                <>
                  <tr key={emp.id}>
                    <td><div className="flex items-center gap-2"><Avatar name={emp.full_name} size="sm"/><div><div className="font-semibold text-[12.5px]">{emp.full_name}</div><div className="text-[10.5px] text-slate-400">{emp.employee_id}</div></div></div></td>
                    <td className="text-[12px] text-slate-500">{emp.position}</td>
                    <td className="text-[12px] text-slate-500">{calcYoS(emp.join_date)}</td>
                    <td>
                      {sc?(
                        <div className="flex flex-col items-center gap-1">
                          <div className={cn('text-[15px] font-bold',parseFloat(sc.score)>=85?'text-teal-600':parseFloat(sc.score)>=70?'text-amber-500':'text-red-500')}>{sc.score}/100</div>
                          <div className="w-20"><ProgressBar value={parseFloat(sc.score)} color={parseFloat(sc.score)>=85?'bg-teal-500':parseFloat(sc.score)>=70?'bg-amber-400':'bg-red-400'}/></div>
                        </div>
                      ):(
                        <div className="text-center">
                          <button onClick={()=>openAdd(emp.id)} className="text-[11px] text-teal-600 hover:underline font-medium">+ Input score</button>
                        </div>
                      )}
                    </td>
                    <td className="text-center">
                      {sc?.csat_link?(
                        <div className="flex flex-col items-center gap-1">
                          <a href={sc.csat_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200"><ExternalLink size={10}/> Buka</a>
                          {sc.csat_score&&<div className="text-[10px] text-slate-400">{sc.csat_score}</div>}
                        </div>
                      ):<span className="text-[11px] text-slate-300">Belum diisi</span>}
                    </td>
                    <td className="text-center">
                      {sc?.kpi_link?(
                        <div className="flex flex-col items-center gap-1">
                          <a href={sc.kpi_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-teal-600 hover:text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200"><ExternalLink size={10}/> Buka</a>
                          {sc.kpi_score&&<div className="text-[10px] text-slate-400">{sc.kpi_score}</div>}
                        </div>
                      ):<span className="text-[11px] text-slate-300">Belum diisi</span>}
                    </td>
                    <td className="text-[12px] text-slate-400">{sc?.pic_name||'–'}</td>
                    <td>{empPip.length>0?<Badge variant="red">PIP/SP</Badge>:<Badge variant="teal">Normal</Badge>}</td>
                    <td><div className="flex items-center justify-center gap-1">
                      <button onClick={()=>setExpanded(expanded===emp.id?null:emp.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-teal-50 hover:text-teal-600 text-slate-400">
                        {expanded===emp.id?<ChevronUp size={12}/>:<ChevronDown size={12}/>}
                      </button>
                      {sc&&<button onClick={()=>openEdit(sc)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400"><Pencil size={12}/></button>}
                    </div></td>
                  </tr>
                  {expanded===emp.id&&(
                    <tr key={emp.id+'_detail'}>
                      <td colSpan={9} className="bg-slate-50 px-5 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-[11px] font-semibold text-slate-600 mb-2">Training</div>
                            {teamTna.filter(t=>t.employee_id===emp.id).length===0
                              ?<div className="text-[11px] text-slate-400">Belum ada data training</div>
                              :teamTna.filter(t=>t.employee_id===emp.id).map(t=>(
                                <div key={t.id} className="flex items-center gap-3 mb-2">
                                  <Badge variant={(t.status==='Done'?'teal':t.status==='Overdue'?'red':'blue') as any}>{t.status}</Badge>
                                  <span className="text-[12px] text-slate-700 font-medium">{t.training_name}</span>
                                  {t.score&&<span className="text-[11px] font-semibold text-teal-600">{t.score}/100</span>}
                                </div>
                              ))
                            }
                          </div>
                          {empPip.length>0&&(
                            <div>
                              <div className="text-[11px] font-semibold text-slate-600 mb-2">PIP / SP aktif</div>
                              {empPip.map((p:any)=>(
                                <div key={p.id} className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="red">{p.type}</Badge>
                                    <span className="text-[11px] text-slate-500">{fmtDate(p.issue_date)} – {fmtDate(p.end_date)}</span>
                                  </div>
                                  <div className="text-[11.5px] text-slate-700">{p.reason}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
            {employees.length===0&&<EmptyState message="Tidak ada anggota tim"/>}
          </tbody>
        </table>
      </div>

      {/* Modal input score */}
      {showModal&&(
        <Modal title={editScoreId?'Edit Performance Score':'Input Performance Score'} onClose={()=>setShowModal(false)}>
          <div className="space-y-3">
            <div><label className="form-label">Karyawan *</label>
              <select value={form.employee_id} onChange={e=>fv('employee_id',e.target.value)} className="form-input">
                <option value="">Pilih karyawan...</option>
                {employees.map(e=><option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Tahun</label>
                <select value={form.year} onChange={e=>fv('year',parseInt(e.target.value))} className="form-input">
                  {YEARS.map(y=><option key={y}>{y}</option>)}
                </select>
              </div>
              <div><label className="form-label">Quarter</label>
                <select value={form.quarter} onChange={e=>fv('quarter',e.target.value)} className="form-input">
                  {QUARTERS.map(q=><option key={q}>{q}</option>)}
                </select>
              </div>
            </div>
            <div><label className="form-label">Score (0–100) *</label><input type="number" value={form.score} onChange={e=>fv('score',e.target.value)} className="form-input" placeholder="e.g. 87.5" min={0} max={100} step={0.5}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Link Form CSAT (Google Sheet)</label><input value={form.csat_link} onChange={e=>fv('csat_link',e.target.value)} className="form-input" placeholder="https://docs.google.com/..."/></div>
              <div><label className="form-label">Nilai CSAT</label><input value={form.csat_score} onChange={e=>fv('csat_score',e.target.value)} className="form-input" placeholder="e.g. 4.2/5"/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Link Form KPI (Google Sheet)</label><input value={form.kpi_link} onChange={e=>fv('kpi_link',e.target.value)} className="form-input" placeholder="https://docs.google.com/..."/></div>
              <div><label className="form-label">Nilai KPI</label><input value={form.kpi_score} onChange={e=>fv('kpi_score',e.target.value)} className="form-input" placeholder="e.g. 91.3/100"/></div>
            </div>
            <div><label className="form-label">PIC Input</label><input value={form.pic_name} onChange={e=>fv('pic_name',e.target.value)} className="form-input" placeholder="Nama HC yang input"/></div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={()=>setShowModal(false)} className="btn btn-ghost">Batal</button>
              <button onClick={save} disabled={saving} className="btn btn-teal">{saving?'Menyimpan...':editScoreId?'Update':'Simpan score'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
