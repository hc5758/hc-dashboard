'use client'
import { useState } from 'react'
import { Plus, ChevronRight, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { KPICard, Badge, InsightCard, EmptyState, ProgressBar, Avatar } from '@/components/ui'
import { fmtDate, cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

export default function LearningClient({ tna: init, employees }: { tna: any[]; employees: any[] }) {
  const router = useRouter()
  const [tna, setTna] = useState(init)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({ employee_id:'', training_name:'', training_category:'Hard Skill', training_method:'Online', quarter:'Q2', year:2026, target_date:'', status:'Planned' })
  const fv = (k:string,v:any) => setForm((p:any)=>({...p,[k]:v}))

  const done = tna.filter(t=>t.status==='Done')
  const overdue = tna.filter(t=>t.status==='Overdue')

  // Per-employee summary
  const empSummary = employees.map(e => {
    const et = tna.filter(t=>t.employee_id===e.id)
    const ed = et.filter(t=>t.status==='Done').length
    const pct = et.length>0 ? Math.round(ed/et.length*100) : 0
    const hasOverdue = et.some(t=>t.status==='Overdue')
    const inProgress = et.some(t=>t.status==='In Progress')
    const avgScore = ed>0&&et.filter(t=>t.score).length>0
      ? Math.round(et.filter(t=>t.score).reduce((s,t)=>s+t.score,0)/et.filter(t=>t.score).length)
      : null
    return { ...e, total:et.length, done:ed, pct, hasOverdue, inProgress, avgScore }
  }).filter(e=>e.total>0 || search.length>0)
    .filter(e=>!search||e.full_name.toLowerCase().includes(search.toLowerCase())||e.division.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>b.total-a.total)

  async function saveQuick(){
    if(!form.employee_id||!form.training_name){ alert('Karyawan dan nama training wajib diisi'); return }
    setSaving(true)
    try{
      const res=await fetch('/api/tna',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
      const data=await res.json()
      if(!res.ok)throw new Error(data.error)
      const emp=employees.find(e=>e.id===form.employee_id)
      setTna(prev=>[{...data.data,employee:emp},...prev])
      setShowModal(false)
    }catch(err:any){alert('Error: '+err.message)}
    setSaving(false)
  }

  return(
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-lg">78%</div>
          <div><div className="text-[11px] text-slate-400">Participation rate</div><div className="text-[13px] font-semibold text-slate-800">vs 65% Q1</div></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
            {tna.length>0?`${Math.round(done.length/tna.length*100)}%`:'0%'}
          </div>
          <div><div className="text-[11px] text-slate-400">Completion rate</div><div className="text-[13px] font-semibold text-slate-800">target 80%</div></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg ${overdue.length>0?'bg-red-50 text-red-500':'bg-teal-50 text-teal-600'}`}>{overdue.length}</div>
          <div><div className="text-[11px] text-slate-400">TNA overdue</div><div className="text-[13px] font-semibold text-slate-800">{overdue.length>0?'perlu action':'semua aman'}</div></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-lg">
            {done.reduce((s,t)=>s+(t.duration_hours??8),0)}
          </div>
          <div><div className="text-[11px] text-slate-400">Total jam training</div><div className="text-[13px] font-semibold text-slate-800">YTD 2026</div></div>
        </div>
      </div>

      {/* Per-person cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-semibold text-slate-800">Training per Karyawan</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 w-48">
              <Search size={12} className="text-slate-300"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama atau divisi..."
                className="bg-transparent text-[12px] outline-none w-full text-slate-700 placeholder:text-slate-300"/>
            </div>
            <button onClick={()=>setShowModal(true)} className="btn btn-teal btn-sm"><Plus size={12}/> Quick add</button>
          </div>
        </div>

        {/* Employees with training */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {empSummary.map(e=>(
            <button key={e.id}
              onClick={()=>router.push(`/learning/person/${e.id}`)}
              className="card p-4 text-left hover:shadow-md hover:border-teal-300 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={e.full_name} size="sm"/>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-semibold text-slate-800 truncate">{e.full_name}</div>
                  <div className="text-[10.5px] text-slate-400">{e.division}</div>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-teal-500 transition-colors flex-shrink-0"/>
              </div>

              <div className="mb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10.5px] text-slate-400">{e.done}/{e.total} training selesai</span>
                  <span className={cn('text-[11px] font-bold',
                    e.hasOverdue?'text-red-500':e.pct===100?'text-teal-600':e.pct>=50?'text-blue-600':'text-amber-500')}>
                    {e.pct}%
                  </span>
                </div>
                <ProgressBar value={e.pct} color={e.hasOverdue?'bg-red-400':e.pct===100?'bg-teal-500':e.pct>=50?'bg-blue-400':'bg-amber-400'}/>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {e.hasOverdue && <Badge variant="red">Overdue</Badge>}
                {e.inProgress && <Badge variant="blue">In Progress</Badge>}
                {e.avgScore && <Badge variant="teal">Avg {e.avgScore}/100</Badge>}
                {!e.hasOverdue && !e.inProgress && e.pct===100 && <Badge variant="teal">✓ Selesai</Badge>}
              </div>
            </button>
          ))}
        </div>

        {/* Employees without training */}
        {employees.filter(e=>!tna.some(t=>t.employee_id===e.id)).length>0 && (
          <div className="card">
            <div className="card-head"><span className="card-title">Belum ada training</span><Badge variant="gray">{employees.filter(e=>!tna.some(t=>t.employee_id===e.id)).length} karyawan</Badge></div>
            <div className="flex flex-wrap gap-2 p-4">
              {employees.filter(e=>!tna.some(t=>t.employee_id===e.id)).map(e=>(
                <button key={e.id} onClick={()=>router.push(`/learning/person/${e.id}`)}
                  className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 hover:border-teal-300 hover:bg-teal-50 transition-all">
                  <Avatar name={e.full_name} size="sm"/>
                  <div className="text-left">
                    <div className="text-[11.5px] font-semibold text-slate-700">{e.full_name.split(' ').slice(0,2).join(' ')}</div>
                    <div className="text-[10px] text-slate-400">{e.division}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick add modal */}
      {showModal&&(
        <Modal title="Quick add training" onClose={()=>setShowModal(false)}>
          <div className="space-y-3">
            <div><label className="form-label">Karyawan *</label>
              <select value={form.employee_id} onChange={e=>fv('employee_id',e.target.value)} className="form-input">
                <option value="">Pilih karyawan...</option>
                {employees.map(e=><option key={e.id} value={e.id}>{e.full_name} — {e.division}</option>)}
              </select>
            </div>
            <div><label className="form-label">Nama training *</label>
              <input value={form.training_name} onChange={e=>fv('training_name',e.target.value)} className="form-input" placeholder="e.g. Leadership Basics"/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Kategori</label>
                <select value={form.training_category} onChange={e=>fv('training_category',e.target.value)} className="form-input">
                  {['Hard Skill','Soft Skill','Leadership','Technical','Compliance','Others'].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="form-label">Target tanggal</label>
                <input type="date" value={form.target_date} onChange={e=>fv('target_date',e.target.value)} className="form-input"/>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-[11.5px] text-slate-500">
              💡 Untuk tambah detail lengkap (link file, score, durasi), klik nama karyawan setelah disimpan.
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={()=>setShowModal(false)} className="btn btn-ghost">Batal</button>
              <button onClick={saveQuick} disabled={saving} className="btn btn-teal">{saving?'Menyimpan...':'Simpan'}</button>
            </div>
          </div>
        </Modal>
      )}

      <div className="grid grid-cols-2 gap-3">
        <InsightCard title="Completion rate 61% — di bawah target 80%" text="Perlu akselerasi eksekusi training di Q2–Q3. Klik nama karyawan untuk lihat dan update progress detail." />
        <InsightCard title="Klik nama karyawan untuk detail training" text="Setiap karyawan punya halaman training tersendiri — lengkap dengan link file, progress, score, dan riwayat training." color="bg-[#1a2d5a]" titleColor="text-teal-200"/>
      </div>
    </div>
  )
}
