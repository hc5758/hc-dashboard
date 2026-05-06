'use client'
import { useState } from 'react'
import { ArrowLeft, Plus, Pencil, Trash2, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Badge, Avatar, EmptyState } from '@/components/ui'
import { fmtDate, cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import * as XLSX from 'xlsx'

const STAGES = ['Applicant','Screening','Interview','Offering','Hired','Rejected']
const STAGE_COLOR: Record<string,string> = {
  Applicant:'gray', Screening:'blue', Interview:'amber',
  Offering:'purple', Hired:'teal', Rejected:'red'
}
const STAGE_BG: Record<string,string> = {
  Applicant:'bg-slate-100', Screening:'bg-blue-100', Interview:'bg-amber-100',
  Offering:'bg-purple-100', Hired:'bg-teal-100', Rejected:'bg-red-100'
}

const EMPTY = { full_name:'', email:'', phone:'', source:'Job Portal', stage:'Applicant', interview_date:'', notes:'' }

export default function JobDetailClient({ job, candidates: initCands }: { job: any; candidates: any[] }) {
  const router = useRouter()
  const [cands, setCands] = useState(initCands)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)
  const [filterStage, setFilterStage] = useState('')
  const fv = (k:string,v:any) => setForm((p:any)=>({...p,[k]:v}))

  const stageCounts = STAGES.reduce((acc,s) => { acc[s]=cands.filter(c=>c.stage===s).length; return acc }, {} as Record<string,number>)
  const filtered = cands.filter(c => !filterStage || c.stage === filterStage)

  function openAdd() { setForm({...EMPTY, recruitment_id: job.id}); setEditId(null); setShowModal(true) }
  function openEdit(c:any) {
    setForm({ full_name:c.full_name, email:c.email||'', phone:c.phone||'',
      source:c.source||'Job Portal', stage:c.stage, interview_date:c.interview_date||'', notes:c.notes||'' })
    setEditId(c.id); setShowModal(true)
  }

  async function save() {
    if (!form.full_name) { alert('Nama kandidat wajib diisi'); return }
    setSaving(true)
    try {
      if (editId) {
        const res = await fetch('/api/candidates',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editId,...form})})
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setCands(prev=>prev.map(c=>c.id===editId?{...data.data}:c))
      } else {
        const res = await fetch('/api/candidates',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,recruitment_id:job.id})})
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setCands(prev=>[data.data,...prev])
      }
      setShowModal(false)
    } catch(err:any){alert('Error: '+err.message)}
    setSaving(false)
  }

  async function del(id:string,name:string) {
    if (!confirm(`Hapus kandidat "${name}"?`)) return
    await fetch(`/api/candidates?id=${id}`,{method:'DELETE'})
    setCands(prev=>prev.filter(c=>c.id!==id))
  }

  async function updateStage(id:string, stage:string) {
    const res = await fetch('/api/candidates',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,stage})})
    if (res.ok) setCands(prev=>prev.map(c=>c.id===id?{...c,stage}:c))
  }

  function exportXls() {
    const rows = cands.map(c=>({
      'Nama':c.full_name,'Email':c.email||'','No HP':c.phone||'',
      'Source':c.source||'','Stage':c.stage,'Tgl Interview':c.interview_date||'','Catatan':c.notes||''
    }))
    const ws=XLSX.utils.json_to_sheet(rows); const wb=XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb,ws,'Kandidat')
    XLSX.writeFile(wb,`kandidat-${job.position.replace(/\s+/g,'-')}.xlsx`)
  }

  const STATUS_FLOW = ['Open','In Progress','Offering','Hired','On Hold','Cancelled']

  return (
    <div className="space-y-5">
      <button onClick={()=>router.push('/recruitment')}
        className="flex items-center gap-2 text-[12.5px] text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft size={15}/> Kembali ke Recruitment
      </button>

      {/* Job info card */}
      <div className="card p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[18px] font-bold text-slate-800">{job.position}</div>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <Badge variant="navy">{job.division}</Badge>
              <Badge variant="gray">{job.entity}</Badge>
              <Badge variant="gray">{job.hiring_source||'–'}</Badge>
              <span className="text-[12px] text-slate-400">PIC: <strong className="text-slate-600">{job.pic_name||'–'}</strong></span>
              <span className="text-[12px] text-slate-400">Request: <strong className="text-slate-600">{fmtDate(job.created_at)}</strong></span>
              <span className="text-[12px] text-slate-400">Target hire: <strong className="text-slate-600">{fmtDate(job.target_date)||'–'}</strong></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select defaultValue={job.status} onChange={async e=>{
              await fetch('/api/recruitment',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:job.id,status:e.target.value})})
            }} className="form-input !w-auto py-1.5 text-[12px]">
              {STATUS_FLOW.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        {job.notes && <div className="mt-3 text-[12px] text-slate-500 bg-slate-50 rounded-lg px-4 py-2.5">{job.notes}</div>}
      </div>

      {/* Stage funnel pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={()=>setFilterStage('')}
          className={cn('px-4 py-2 rounded-lg text-[12px] font-semibold border transition-all',
            !filterStage?'bg-[#0f1e3d] text-white border-[#0f1e3d]':'bg-white text-slate-500 border-slate-200 hover:border-slate-400')}>
          Semua ({cands.length})
        </button>
        {STAGES.map(s=>(
          <button key={s} onClick={()=>setFilterStage(filterStage===s?'':s)}
            className={cn('px-4 py-2 rounded-lg text-[12px] font-semibold border transition-all',
              filterStage===s?`${STAGE_BG[s]} border-transparent text-slate-800`:'bg-white text-slate-500 border-slate-200 hover:border-slate-400')}>
            {s} {stageCounts[s]>0&&<span className="ml-1">({stageCounts[s]})</span>}
          </button>
        ))}
      </div>

      {/* Candidates table */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">Kandidat — {job.position}</span>
          <div className="flex items-center gap-2">
            <button onClick={exportXls} className="btn btn-ghost btn-sm"><Download size={12}/> Export</button>
            <button onClick={openAdd} className="btn btn-teal btn-sm"><Plus size={12}/> Tambah kandidat</button>
          </div>
        </div>
        <table className="tbl">
          <thead><tr><th>Nama</th><th>Email / HP</th><th>Source</th><th>Stage</th><th>Tgl Interview</th><th>Catatan</th><th className="text-center">Aksi</th></tr></thead>
          <tbody>
            {filtered.map(c=>(
              <tr key={c.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <Avatar name={c.full_name} size="sm"/>
                    <span className="font-semibold text-[12.5px]">{c.full_name}</span>
                  </div>
                </td>
                <td className="text-[12px] text-slate-400">
                  {c.email&&<div>{c.email}</div>}
                  {c.phone&&<div>{c.phone}</div>}
                  {!c.email&&!c.phone&&'–'}
                </td>
                <td><Badge variant="gray">{c.source||'–'}</Badge></td>
                <td>
                  <select value={c.stage} onChange={e=>updateStage(c.id,e.target.value)}
                    className={cn('badge border cursor-pointer outline-none bg-transparent text-[10.5px] font-semibold appearance-none',`badge-${STAGE_COLOR[c.stage]??'gray'}`)}>
                    {STAGES.map(s=><option key={s}>{s}</option>)}
                  </select>
                </td>
                <td className="text-[12px] text-slate-400">{fmtDate(c.interview_date)||'–'}</td>
                <td className="text-[12px] text-slate-500 max-w-[180px]"><span className="line-clamp-1">{c.notes||'–'}</span></td>
                <td><div className="flex items-center justify-center gap-1">
                  <button onClick={()=>openEdit(c)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400"><Pencil size={12}/></button>
                  <button onClick={()=>del(c.id,c.full_name)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-500 text-slate-400"><Trash2 size={12}/></button>
                </div></td>
              </tr>
            ))}
            {filtered.length===0&&<EmptyState message="Belum ada kandidat di tahap ini"/>}
          </tbody>
        </table>
      </div>

      {showModal&&(
        <Modal title={editId?'Edit kandidat':'Tambah kandidat'} onClose={()=>setShowModal(false)}>
          <div className="space-y-3">
            <div><label className="form-label">Nama kandidat *</label><input value={form.full_name} onChange={e=>fv('full_name',e.target.value)} className="form-input" placeholder="Nama lengkap"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Email</label><input type="email" value={form.email} onChange={e=>fv('email',e.target.value)} className="form-input" placeholder="email@mail.com"/></div>
              <div><label className="form-label">No. HP</label><input value={form.phone} onChange={e=>fv('phone',e.target.value)} className="form-input" placeholder="08xx"/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Source</label>
                <select value={form.source} onChange={e=>fv('source',e.target.value)} className="form-input">
                  {['Job Portal','LinkedIn','Referral','Internal','Headhunter','Walk-in'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="form-label">Stage saat ini</label>
                <select value={form.stage} onChange={e=>fv('stage',e.target.value)} className="form-input">
                  {STAGES.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div><label className="form-label">Tanggal interview</label><input type="date" value={form.interview_date} onChange={e=>fv('interview_date',e.target.value)} className="form-input"/></div>
            <div><label className="form-label">Catatan</label><textarea value={form.notes} onChange={e=>fv('notes',e.target.value)} className="form-input h-16 resize-none" placeholder="Catatan tentang kandidat..."/></div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={()=>setShowModal(false)} className="btn btn-ghost">Batal</button>
              <button onClick={save} disabled={saving} className="btn btn-teal">{saving?'Menyimpan...':editId?'Update':'Tambah'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
