'use client'
import { useState } from 'react'
import { Plus, Pencil, Trash2, ChevronRight, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Badge, InlineBar, InsightCard, EmptyState } from '@/components/ui'
import { fmtDate, cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

const TEAMS_BASE = [
  { div:'Creative',      members:15, pip:1 },
  { div:'Finance',       members:4,  pip:0 },
  { div:'Marketing',     members:10, pip:1 },
  { div:'Human Capital', members:3,  pip:0 },
  { div:'Operations',    members:4,  pip:0 },
  { div:'Social Media',  members:7,  pip:2 },
  { div:'IT & Systems',  members:2,  pip:0 },
]
// Scores by year
const SCORES_BY_YEAR: Record<number, Record<string,number>> = {
  2026: { Creative:3.8, Finance:4.3, Marketing:3.6, 'Human Capital':4.0, Operations:3.3, 'Social Media':3.0, 'IT & Systems':3.9 },
  2025: { Creative:3.5, Finance:4.1, Marketing:3.4, 'Human Capital':3.8, Operations:3.1, 'Social Media':2.8, 'IT & Systems':3.7 },
  2024: { Creative:3.3, Finance:3.9, Marketing:3.2, 'Human Capital':3.6, Operations:3.0, 'Social Media':2.6, 'IT & Systems':3.5 },
}
const EMPTY_PIP = { employee_id:'', pic_name:'', type:'SP1', issue_date:'', end_date:'', reason:'', improvement_plan:'', status:'Active' }

export default function PerformanceClient({ pip: initPip, employees, tna, scores: initScores }: { pip:any[]; employees:any[]; tna:any[]; scores:any[] }) {
  const router = useRouter()
  const [pip, setPip] = useState(initPip)
  const [year, setYear] = useState(2026)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>(EMPTY_PIP)
  const fv = (k:string,v:any) => setForm((p:any)=>({...p,[k]:v}))

  // Avg score per divisi dari DB, fallback ke hardcoded
  const divisionScores = (() => {
    const yearScores = initScores.filter(s=>s.year===year)
    if (yearScores.length === 0) return SCORES_BY_YEAR[year] ?? SCORES_BY_YEAR[2026]
    const byDiv: Record<string,number[]> = {}
    yearScores.forEach(s=>{
      const div = s.employee?.division; if(!div) return
      if(!byDiv[div]) byDiv[div]=[]
      byDiv[div].push(parseFloat(s.score)/20) // 0-100 → 0-5
    })
    const result: Record<string,number> = {}
    Object.entries(byDiv).forEach(([div,arr])=>{
      result[div]=Math.round((arr.reduce((a,b)=>a+b,0)/arr.length)*10)/10
    })
    return { ...(SCORES_BY_YEAR[year]??SCORES_BY_YEAR[2026]), ...result }
  })()

  const teams = TEAMS_BASE.map(t=>({
    ...t,
    score: divisionScores[t.div]??3.0,
    top: Math.floor(t.members*0.2),
    hasRealData: initScores.some(s=>s.year===year&&s.employee?.division===t.div),
  })).sort((a,b)=>b.score-a.score)

  const avgTrainingScore = tna&&tna.length>0?(tna.reduce((s,t)=>s+(t.score??0),0)/tna.length).toFixed(1):'–'

  function openAdd(){ setForm({...EMPTY_PIP}); setEditId(null); setShowModal(true) }
  function openEdit(p:any){
    setForm({ employee_id:p.employee_id, pic_name:p.pic_name||'', type:p.type,
      issue_date:p.issue_date||'', end_date:p.end_date||'', reason:p.reason||'',
      improvement_plan:p.improvement_plan||'', status:p.status })
    setEditId(p.id); setShowModal(true)
  }

  async function save(){
    if(!form.employee_id||!form.reason||!form.issue_date){alert('Karyawan, tanggal, dan alasan wajib diisi');return}
    setSaving(true)
    try{
      if(editId){
        const res=await fetch('/api/pip',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editId,...form})})
        const data=await res.json();if(!res.ok)throw new Error(data.error)
        const emp=employees.find(e=>e.id===form.employee_id)
        setPip(prev=>prev.map(p=>p.id===editId?{...data.data,employee:emp}:p))
      }else{
        const res=await fetch('/api/pip',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
        const data=await res.json();if(!res.ok)throw new Error(data.error)
        const emp=employees.find(e=>e.id===form.employee_id)
        setPip(prev=>[{...data.data,employee:emp},...prev])
      }
      setShowModal(false)
    }catch(err:any){alert('Error: '+err.message)}
    setSaving(false)
  }

  async function del(id:string){
    if(!confirm('Hapus record PIP/SP ini?'))return
    await fetch(`/api/pip?id=${id}`,{method:'DELETE'})
    setPip(prev=>prev.filter(p=>p.id!==id))
  }

  async function toggleStatus(p:any){
    const ns=p.status==='Active'?'Completed':'Active'
    const res=await fetch('/api/pip',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id,status:ns})})
    if(res.ok)setPip(prev=>prev.map(x=>x.id===p.id?{...x,status:ns}:x))
  }

  return(
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3">
        <div className="card p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold">{avgTrainingScore}</div><div><div className="text-[11px] text-slate-400">Avg training score</div><div className="text-[13px] font-semibold">dari 100</div></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-lg">{pip.filter(p=>p.status==='Active').length}</div><div><div className="text-[11px] text-slate-400">PIP / SP aktif</div><div className="text-[13px] font-semibold">monitoring</div></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-lg">{pip.filter(p=>p.status==='Completed').length}</div><div><div className="text-[11px] text-slate-400">SP selesai</div><div className="text-[13px] font-semibold">YTD 2026</div></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">{tna&&tna.length>0?Math.max(...tna.map(t=>t.score??0)):0}</div><div><div className="text-[11px] text-slate-400">Score tertinggi</div><div className="text-[13px] font-semibold">dari 100</div></div></div>
      </div>

      {/* Year filter */}
      <div className="flex items-center gap-3">
        <h2 className="text-[14px] font-semibold text-slate-800">Performance per Tim</h2>
        <div className="flex gap-2 ml-2">
          {[2026,2025,2024].map(y=>(
            <button key={y} onClick={()=>setYear(y)}
              className={cn('px-3.5 py-1.5 rounded-lg text-[12px] font-semibold border transition-all',
                year===y?'bg-[#0f1e3d] text-white border-[#0f1e3d]':'bg-white text-slate-500 border-slate-200 hover:border-slate-400')}>
              {y}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[11.5px] text-slate-400">Klik tim untuk lihat detail anggota, CSAT & KPI</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {teams.map(t=>(
          <button key={t.div} onClick={()=>router.push(`/performance/team/${encodeURIComponent(t.div)}`)}
            className="card p-4 text-left hover:shadow-md hover:border-[#2ab89a] transition-all group cursor-pointer">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><Users size={15} className="text-slate-500"/></div>
                <span className="text-[12.5px] font-semibold text-slate-700 truncate max-w-[90px]">{t.div}</span>
              </div>
              <ChevronRight size={14} className="text-slate-300 group-hover:text-[#2ab89a] transition-colors"/>
            </div>
            <div className={cn('text-2xl font-bold mb-1',t.score>=4?'text-teal-600':t.score>=3.5?'text-amber-500':'text-red-500')}>
              {t.score}<span className="text-[13px] text-slate-300 font-medium">/5</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3">
              <div className={cn('h-1.5 rounded-full',t.score>=4?'bg-teal-500':t.score>=3.5?'bg-amber-400':'bg-red-400')} style={{width:`${(t.score/5)*100}%`}}/>
            </div>
            <div className="flex items-center justify-between text-[10.5px] text-slate-400">
              <span>{t.members} orang</span>
              <span className="flex items-center gap-2">
                {t.top>0&&<span className="text-teal-600 font-semibold">⭐ {t.top} top</span>}
                {t.pip>0&&<span className="text-red-500 font-semibold">⚠ {t.pip} PIP</span>}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Bar chart */}
      <div className="card">
        <div className="card-head"><span className="card-title">Avg performance score by division — {year}</span></div>
        <div className="card-body space-y-2">
          {teams.map(t=>(
            <InlineBar key={t.div} label={t.div} value={`${t.score}/5`} pct={Math.round((t.score/5)*100)}
              color={t.score>=4?'bg-teal-500':t.score>=3.5?'bg-[#0f1e3d]':'bg-amber-500'}/>
          ))}
        </div>
      </div>

      {/* PIP */}
      <div className="card overflow-x-auto">
        <div className="card-head">
          <span className="card-title">PIP / SP monitoring</span>
          <button onClick={openAdd} className="btn btn-teal btn-sm"><Plus size={12}/> Tambah PIP/SP</button>
        </div>
        <table className="tbl">
          <thead><tr><th>Karyawan</th><th>Divisi</th><th>Tipe</th><th>Mulai</th><th>Deadline</th><th>Alasan</th><th>Rencana perbaikan</th><th>Status</th><th className="text-center">Aksi</th></tr></thead>
          <tbody>
            {pip.map(p=>(
              <tr key={p.id}>
                <td className="font-semibold">{p.employee?.full_name}</td>
                <td className="text-[11.5px] text-slate-400">{p.employee?.division}</td>
                <td><Badge variant={p.type==='PIP'?'red':'amber'}>{p.type}</Badge></td>
                <td className="text-[11.5px] text-slate-400">{fmtDate(p.issue_date)}</td>
                <td className="text-[11.5px] text-slate-400">{fmtDate(p.end_date)}</td>
                <td className="text-[11.5px] text-slate-500 max-w-[140px]"><span className="line-clamp-1">{p.reason??'–'}</span></td>
                <td className="text-[11.5px] text-slate-500 max-w-[160px]"><span className="line-clamp-1">{p.improvement_plan??'–'}</span></td>
                <td><button onClick={()=>toggleStatus(p)} className={cn('badge cursor-pointer',p.status==='Active'?'badge-amber':'badge-teal')}>{p.status}</button></td>
                <td><div className="flex items-center justify-center gap-1">
                  <button onClick={()=>openEdit(p)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400"><Pencil size={12}/></button>
                  <button onClick={()=>del(p.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-500 text-slate-400"><Trash2 size={12}/></button>
                </div></td>
              </tr>
            ))}
            {pip.length===0&&<EmptyState message="Tidak ada PIP/SP"/>}
          </tbody>
        </table>
      </div>

      {showModal&&(
        <Modal title={editId?'Edit PIP/SP':'Tambah PIP/SP baru'} onClose={()=>setShowModal(false)}>
          <div className="space-y-3">
            <div><label className="form-label">Karyawan *</label>
              <select value={form.employee_id} onChange={e=>fv('employee_id',e.target.value)} className="form-input">
                <option value="">Pilih karyawan...</option>
                {employees.map(e=><option key={e.id} value={e.id}>{e.full_name} — {e.division}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Tipe</label>
                <select value={form.type} onChange={e=>fv('type',e.target.value)} className="form-input"><option>SP1</option><option>SP2</option><option>SP3</option><option>PIP</option></select>
              </div>
              <div><label className="form-label">Status</label>
                <select value={form.status} onChange={e=>fv('status',e.target.value)} className="form-input"><option>Active</option><option>Completed</option><option>Extended</option><option>Terminated</option></select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Tgl mulai *</label><input type="date" value={form.issue_date} onChange={e=>fv('issue_date',e.target.value)} className="form-input"/></div>
              <div><label className="form-label">Deadline</label><input type="date" value={form.end_date} onChange={e=>fv('end_date',e.target.value)} className="form-input"/></div>
            </div>
            <div><label className="form-label">Alasan *</label><textarea value={form.reason} onChange={e=>fv('reason',e.target.value)} className="form-input h-16 resize-none" placeholder="Jelaskan alasan PIP/SP..."/></div>
            <div><label className="form-label">Rencana perbaikan</label><textarea value={form.improvement_plan} onChange={e=>fv('improvement_plan',e.target.value)} className="form-input h-16 resize-none" placeholder="Langkah perbaikan..."/></div>
            <div><label className="form-label">PIC</label><input value={form.pic_name} onChange={e=>fv('pic_name',e.target.value)} className="form-input" placeholder="Nama HR yang handle"/></div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={()=>setShowModal(false)} className="btn btn-ghost">Batal</button>
              <button onClick={save} disabled={saving} className="btn btn-teal">{saving?'Menyimpan...':editId?'Update':'Tambah'}</button>
            </div>
          </div>
        </Modal>
      )}

      <div className="grid grid-cols-2 gap-3">
        <InsightCard title="Finance: top performer" text="Finance konsisten tertinggi di semua tahun. Extract best practice dan replikasikan ke divisi lain." color="bg-teal-700" titleColor="text-teal-100"/>
        <InsightCard title="Social Media: performa terendah" text="Triple concern: performa rendah + absensi tinggi + turnover tinggi. Intervensi menyeluruh diperlukan." color="bg-red-900/70" titleColor="text-red-200"/>
      </div>
    </div>
  )
}
