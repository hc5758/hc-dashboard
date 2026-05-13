'use client'
import { useState } from 'react'
import BulkBar from '@/components/ui/BulkBar'
import { useBulkSelect } from '@/lib/useBulkSelect'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { InlineBar, InsightCard, EmptyState } from '@/components/ui'
import { cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

const DIVS = ['BOD','BOC','KOM','Project Management','Finance & Accounting','Data','Growth and Partnership','Human Capital','Strategist','Budget & BS','Community Activation and Network','Production','Nyambee','Business Development','Creative']
const QUARTERS = ['Q1','Q2','Q3','Q4']
const EMPTY = { year:2026, quarter:'Q1', division:'Creative', engagement_score:'', satisfaction_score:'', response_count:0, total_count:0, notes:'' }

const TURNOVER_BY_DIV: Record<string,number> = {
  Creative:13.3, Marketing:10, 'Social Media':14.3,
  Finance:0, 'Human Capital':0, Operations:0, 'IT & Systems':0
}

export default function EngagementClient({ surveys: initS, surveys2025, offboarding, employees }: {
  surveys: any[]; surveys2025: any[]; offboarding: any[]; employees: any[]
}) {
  const [surveys, setSurveys] = useState(initS)
  const bulk = useBulkSelect()
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [year, setYear]       = useState(2026)
  const [quarter, setQuarter] = useState('Q1')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId]   = useState<string|null>(null)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState<any>(EMPTY)
  const [msg, setMsg]         = useState('')
  const fv = (k:string,v:any) => setForm((p:any)=>({...p,[k]:v}))
  const flash = (t:string) => { setMsg(t); setTimeout(()=>setMsg(''),4000) }

  const displayed = surveys.filter(s => s.quarter === quarter)
  const src       = year === 2025 ? surveys2025 : surveys
  const dispSrc   = src.filter(s => s.quarter === quarter)

  const avgEng = dispSrc.length>0 ? (dispSrc.reduce((s,sv)=>s+(sv.engagement_score??0),0)/dispSrc.length).toFixed(1) : '–'
  const avgSat = dispSrc.length>0 ? (dispSrc.reduce((s,sv)=>s+(sv.satisfaction_score??0),0)/dispSrc.length).toFixed(1) : '–'
  const totalResp  = dispSrc.reduce((s,sv)=>s+sv.response_count,0)
  const totalCount = dispSrc.reduce((s,sv)=>s+sv.total_count,0)
  const rr = totalCount>0 ? Math.round(totalResp/totalCount*100) : 0

  const maxEng = Math.max(...dispSrc.map(s=>s.engagement_score??0),5)

  function openAdd(div?:string){ setForm({...EMPTY,year,quarter,division:div||'Creative'}); setEditId(null); setShowModal(true) }
  function openEdit(s:any){
    setForm({ year:s.year, quarter:s.quarter, division:s.division,
      engagement_score:s.engagement_score||'', satisfaction_score:s.satisfaction_score||'',
      response_count:s.response_count||0, total_count:s.total_count||0, notes:s.notes||'' })
    setEditId(s.id); setShowModal(true)
  }

  async function save(){
    if(!form.division||!form.engagement_score){alert('Divisi dan engagement score wajib diisi');return}
    setSaving(true)
    try{
      const payload={...form,engagement_score:parseFloat(form.engagement_score),satisfaction_score:form.satisfaction_score?parseFloat(form.satisfaction_score):null}
      if(editId){
        const res=await fetch('/api/engagement',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editId,...payload})})
        const data=await res.json();if(!res.ok)throw new Error(data.error)
        setSurveys(prev=>prev.map(s=>s.id===editId?data.data:s))
      }else{
        const res=await fetch('/api/engagement',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
        const data=await res.json();if(!res.ok)throw new Error(data.error)
        setSurveys(prev=>[data.data,...prev])
      }
      setShowModal(false);flash('✓ Data berhasil disimpan')
    }catch(err:any){alert('Error: '+err.message)}
    setSaving(false)
  }

  async function del(id:string){
    if(!confirm('Hapus data engagement ini?'))return
    await fetch(`/api/engagement?id=${id}`,{method:'DELETE'})
    setSurveys(prev=>prev.filter(s=>s.id!==id))
    flash('✓ Data dihapus')
  }

  async function bulkDel(){
    if(bulk.count===0) return
    if(!confirm(`Hapus ${bulk.count} data yang dipilih?`)) return
    setBulkDeleting(true)
    const ids=[...bulk.checkedIds]
    await Promise.all(ids.map(id=>fetch(`/api/engagement?id=${id}`,{method:'DELETE'})))
    setSurveys(prev=>(prev as any[]).filter((x:any)=>!ids.includes(x.id)))
    bulk.clear(); setBulkDeleting(false)
  }

  const scoreColor = (s:number) => s>=4.0?'text-teal-600':s>=3.5?'text-blue-600':s>=3.0?'text-amber-500':'text-red-500'
  const barColor   = (s:number) => s>=4.0?'bg-teal-500':s>=3.5?'bg-[#0f1e3d]':s>=3.0?'bg-amber-500':'bg-red-500'

  return(
    <div className="space-y-5">
      {/* Filter tahun + quarter */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {[2026,2025].map(y=>(
            <button key={y} onClick={()=>setYear(y)}
              className={cn('px-3.5 py-1.5 rounded-lg text-[12px] font-semibold border transition-all',
                year===y?'bg-[#0f1e3d] text-white border-[#0f1e3d]':'bg-white text-slate-500 border-slate-200 hover:border-slate-400')}>
              {y}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {QUARTERS.map(q=>(
            <button key={q} onClick={()=>setQuarter(q)}
              className={cn('px-3.5 py-1.5 rounded-lg text-[12px] font-semibold border transition-all',
                quarter===q?'bg-[#2ab89a] text-white border-[#2ab89a]':'bg-white text-slate-500 border-slate-200 hover:border-slate-400')}>
              {q}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {msg&&<span className={cn('text-[11px] font-medium',msg.startsWith('✓')?'text-teal-600':'text-red-500')}>{msg}</span>}
          <button onClick={()=>openAdd()} className="btn btn-teal btn-sm"><Plus size={12}/> Input Engagement</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { val:`${avgEng}/5`, label:'Avg Engagement Score', sub:`${quarter} ${year}`, color:'text-teal-600', bg:'bg-teal-50' },
          { val:`${avgSat}/5`, label:'Avg Satisfaction (CSAT)', sub:`${quarter} ${year}`, color:'text-blue-600', bg:'bg-blue-50' },
          { val:`${rr}%`, label:'Response Rate', sub:'target 80%', color:'text-amber-600', bg:'bg-amber-50' },
          { val:'+24', label:'eNPS Score', sub:'Good', color:'text-purple-600', bg:'bg-purple-50' },
        ].map((k,i)=>(
          <div key={i} className="card p-4 flex items-center gap-3">
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0',k.bg,k.color)}>{k.val}</div>
            <div><div className="text-[13px] font-semibold text-slate-800">{k.label}</div><div className="text-[11.5px] text-slate-400 mt-0.5">{k.sub}</div></div>
          </div>
        ))}
      </div>

      {/* Engagement score by div + korelasi */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="card-head">
            <span className="card-title">Engagement Score by Division — {quarter} {year}</span>
          </div>
          {dispSrc.length===0?(
            <div className="p-6 text-center">
              <div className="text-[13px] text-slate-400 mb-3">Belum ada data {quarter} {year}</div>
              <button onClick={()=>openAdd()} className="btn btn-teal btn-sm"><Plus size={12}/> Input sekarang</button>
            </div>
          ):(
            <div className="card-body space-y-2">
              {dispSrc.map(sv=>(
                <div key={sv.id} className="bar-row group">
                  <div className="bar-lbl">{sv.division}</div>
                  <div className="bar-track">
                    <div className={cn('bar-fill',barColor(sv.engagement_score))} style={{width:`${(sv.engagement_score/5)*100}%`}}>
                      <span className="text-[10px] font-bold text-white">{sv.engagement_score}/5</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={()=>openEdit(sv)} className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 hover:bg-blue-100 hover:text-blue-600 text-slate-400"><Pencil size={10}/></button>
                    <button onClick={()=>del(sv.id)} className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 hover:bg-red-100 hover:text-red-500 text-slate-400"><Trash2 size={10}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Divisi yang belum ada data */}
          {DIVS.filter(d=>!dispSrc.some(s=>s.division===d)).length>0&&dispSrc.length>0&&(
            <div className="px-5 pb-4">
              <div className="text-[10.5px] text-slate-400 mb-1.5">Belum ada data:</div>
              <div className="flex flex-wrap gap-2">
                {DIVS.filter(d=>!dispSrc.some(s=>s.division===d)).map(d=>(
                  <button key={d} onClick={()=>openAdd(d)}
                    className="text-[10.5px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 hover:border-teal-400 hover:text-teal-600 transition-all">
                    <Plus size={10} className="inline mr-1"/>{d}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Korelasi engagement vs turnover */}
        <div className="card">
          <div className="card-head"><span className="card-title">Engagement vs Turnover (Korelasi)</span></div>
          {dispSrc.length===0?(
            <div className="p-6 text-center text-[12px] text-slate-400">Input data engagement untuk melihat korelasi</div>
          ):(
            <div className="card-body space-y-3">
              <div className="text-[11.5px] text-slate-400 mb-2">Engagement rendah → turnover tinggi.</div>
              {dispSrc.map(sv=>{
                const turn = TURNOVER_BY_DIV[sv.division]??0
                const engBg  = sv.engagement_score>=4?'bg-teal-50 text-teal-700':sv.engagement_score>=3.5?'bg-amber-50 text-amber-700':'bg-red-50 text-red-700'
                const turnBg = turn===0?'bg-teal-50 text-teal-700':turn>=12?'bg-red-50 text-red-700':'bg-amber-50 text-amber-700'
                return(
                  <div key={sv.id} className="flex items-center gap-3">
                    <div className="text-[11.5px] text-slate-600 w-[90px] flex-shrink-0">{sv.division}</div>
                    <div className="flex gap-2 flex-1">
                      <div className={cn('flex-1 rounded-xl px-3 py-2 text-center',engBg)}>
                        <div className="text-[14px] font-bold">{sv.engagement_score}</div>
                        <div className="text-[9.5px]">engagement</div>
                      </div>
                      <div className="flex items-center text-slate-200 text-lg">→</div>
                      <div className={cn('flex-1 rounded-xl px-3 py-2 text-center',turnBg)}>
                        <div className="text-[14px] font-bold">{turn}%</div>
                        <div className="text-[9.5px]">turnover</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Engagement by tenure */}
      <div className="card">
        <div className="card-head"><span className="card-title">Engagement by Tenure</span></div>
        <div className="grid grid-cols-4 divide-x divide-slate-100">
          {[
            {label:'0 – 6 bulan',  score:'3.1', color:'text-amber-500', note:'Masa adaptasi — terendah'},
            {label:'6 – 12 bulan', score:'3.7', color:'text-blue-600',  note:'Meningkat pasca probasi'},
            {label:'1 – 2 tahun',  score:'4.2', color:'text-teal-600',  note:'Paling engaged'},
            {label:'> 2 tahun',    score:'4.0', color:'text-teal-600',  note:'Stabil, loyal'},
          ].map(t=>(
            <div key={t.label} className="p-5 text-center">
              <div className={cn('text-3xl font-bold',t.color)}>{t.score}</div>
              <div className="text-[12.5px] font-semibold text-slate-800 mt-2">{t.label}</div>
              <div className="text-[11px] text-slate-400 mt-1">{t.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Insights */}
      {(()=>{
        if(dispSrc.length===0) return(
          <div className="grid grid-cols-2 gap-3">
            <InsightCard title="Belum ada data engagement" text="Input data survey engagement untuk melihat insight dan korelasi dengan turnover." color="bg-[#1a2d5a]" titleColor="text-teal-200"/>
          </div>
        )
        // Divisi tertinggi dan terendah
        const sorted = [...dispSrc].filter(s=>s.engagement_score).sort((a,b)=>(b.engagement_score??0)-(a.engagement_score??0))
        const topDiv = sorted[0]
        const botDiv = sorted[sorted.length-1]
        const avg = sorted.length>0?(sorted.reduce((s,d)=>s+(d.engagement_score??0),0)/sorted.length).toFixed(1):'0'

        const insights = []

        if(topDiv) insights.push({
          title: `${topDiv.division}: engagement tertinggi (${topDiv.engagement_score}/5)`,
          text: topDiv.engagement_score>=4
            ? `${topDiv.division} punya engagement terbaik. Pelajari apa yang dilakukan manager dan jadikan referensi untuk divisi lain.`
            : `${topDiv.division} memimpin dengan ${topDiv.engagement_score}/5. Rata-rata keseluruhan ${avg}/5.`,
          color: 'bg-teal-700', titleColor: 'text-teal-100'
        })

        if(botDiv && botDiv.division!==topDiv?.division) insights.push({
          title: `${botDiv.division}: engagement terendah (${botDiv.engagement_score}/5)`,
          text: (botDiv.engagement_score??5)<3
            ? `Score di bawah 3 — cukup mengkhawatirkan. Pertimbangkan 1-on-1 session dan review beban kerja di ${botDiv.division}.`
            : `${botDiv.division} sedikit di bawah rata-rata (${avg}). Perlu perhatian lebih agar tidak turun lebih jauh.`,
          color: (botDiv.engagement_score??5)<3?'bg-red-900/70':'bg-amber-900/60',
          titleColor: (botDiv.engagement_score??5)<3?'text-red-200':'text-amber-300'
        })

        return(
          <div className="grid grid-cols-2 gap-3">
            {insights.map((ins,i)=>(
              <div key={i}><InsightCard title={String(ins.title)} text={String(ins.text)} color={ins.color as string} titleColor={ins.titleColor as string}/></div>
            ))}
          </div>
        )
      })()}

      {/* Modal */}
      {showModal&&(
        <Modal title={editId?'Edit Data Engagement':'Input Engagement Survey'} onClose={()=>setShowModal(false)}>
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-[12px] text-blue-700">
              💡 Isi dari hasil survey engagement yang sudah dilakukan per divisi. Skor skala 1–5.
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="form-label">Tahun</label>
                <select value={form.year} onChange={e=>fv('year',parseInt(e.target.value))} className="form-input">
                  <option value={2026}>2026</option><option value={2025}>2025</option><option value={2024}>2024</option>
                </select>
              </div>
              <div><label className="form-label">Quarter</label>
                <select value={form.quarter} onChange={e=>fv('quarter',e.target.value)} className="form-input">
                  {QUARTERS.map(q=><option key={q}>{q}</option>)}
                </select>
              </div>
              <div><label className="form-label">Divisi</label>
                <select value={form.division} onChange={e=>fv('division',e.target.value)} className="form-input">
                  {DIVS.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Engagement Score * (1.0–5.0)</label>
                <input type="number" value={form.engagement_score} onChange={e=>fv('engagement_score',e.target.value)} className="form-input" placeholder="e.g. 3.8" min={1} max={5} step={0.1}/>
              </div>
              <div><label className="form-label">Satisfaction Score (CSAT) (1.0–5.0)</label>
                <input type="number" value={form.satisfaction_score} onChange={e=>fv('satisfaction_score',e.target.value)} className="form-input" placeholder="e.g. 3.5" min={1} max={5} step={0.1}/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Jumlah responden</label>
                <input type="number" value={form.response_count} onChange={e=>fv('response_count',parseInt(e.target.value)||0)} className="form-input" min={0}/>
              </div>
              <div><label className="form-label">Total karyawan divisi</label>
                <input type="number" value={form.total_count} onChange={e=>fv('total_count',parseInt(e.target.value)||0)} className="form-input" min={0}/>
              </div>
            </div>
            <div><label className="form-label">Catatan</label>
              <textarea value={form.notes} onChange={e=>fv('notes',e.target.value)} className="form-input h-14 resize-none" placeholder="Highlight temuan atau catatan survey..."/>
            </div>
            {form.engagement_score&&(
              <div className={cn('rounded-lg px-4 py-3 text-[12px] font-semibold',
                parseFloat(form.engagement_score)>=4?'bg-teal-50 text-teal-700':parseFloat(form.engagement_score)>=3.5?'bg-blue-50 text-blue-700':parseFloat(form.engagement_score)>=3?'bg-amber-50 text-amber-700':'bg-red-50 text-red-700')}>
                Skor {form.engagement_score}/5 — {parseFloat(form.engagement_score)>=4?'Sangat Engaged 🎉':parseFloat(form.engagement_score)>=3.5?'Engaged ✓':parseFloat(form.engagement_score)>=3?'Cukup ⚠':'Perlu Perhatian 🚨'}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={()=>setShowModal(false)} className="btn btn-ghost">Batal</button>
              <button onClick={save} disabled={saving} className="btn btn-teal">{saving?'Menyimpan...':editId?'Update':'Simpan'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
