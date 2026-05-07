'use client'
import { useState } from 'react'
import { ArrowLeft, Plus, Pencil, Trash2, Download, ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Badge, Avatar, EmptyState } from '@/components/ui'
import { fmtDate, cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import * as XLSX from 'xlsx'

const NAME_STAGES  = ['Psikotest','Dummy Deck','User Interview 1','User Interview 2']
const ALL_STAGES   = ['Psikotest','Quick Call','Dummy Deck','User Interview 1','User Interview 2','Hired','Rejected']
const STAGE_ORDER  = ['Psikotest','Quick Call','Dummy Deck','User Interview 1','User Interview 2','Hired']

const STAGE_COLOR: Record<string,string> = {
  Psikotest:'blue','Quick Call':'amber','Dummy Deck':'purple',
  'User Interview 1':'teal','User Interview 2':'teal',Hired:'teal',Rejected:'red'
}

const EMPTY = { full_name:'', email:'', phone:'', source:'Job Portal', stage:'Psikotest', interview_date:'', notes:'' }

export default function JobDetailClient({ job, candidates: initCands }: { job: any; candidates: any[] }) {
  const router  = useRouter()
  const [cands, setCands]         = useState(initCands)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId]       = useState<string|null>(null)
  const [saving, setSaving]       = useState(false)
  const [form, setForm]           = useState<any>(EMPTY)
  const [filterStage, setFilterStage] = useState('')
  const [quickCallDone, setQuickCallDone] = useState(
    initCands.some(c=>c.stage==='Quick Call')
  )
  const [expanded, setExpanded]   = useState<string|null>(null)
  const fv = (k:string,v:any) => setForm((p:any)=>({...p,[k]:v}))

  const stageCounts = ALL_STAGES.reduce((acc,s)=>{ acc[s]=cands.filter(c=>c.stage===s).length; return acc },{} as Record<string,number>)
  const activeCands = cands.filter(c=>c.stage!=='Rejected')
  const hired       = cands.filter(c=>c.stage==='Hired')
  const rejected    = cands.filter(c=>c.stage==='Rejected')

  const furthestIdx = activeCands.reduce((max,c)=>{
    const idx=STAGE_ORDER.indexOf(c.stage); return idx>max?idx:max
  },-1)

  const displayCands = (filterStage
    ? cands.filter(c=>c.stage===filterStage)
    : cands
  ).filter(c=>c.stage!=='Quick Call')

  function openAdd(defaultStage='Psikotest'){ setForm({...EMPTY,stage:defaultStage}); setEditId(null); setShowModal(true) }
  function openEdit(c:any){
    setForm({ full_name:c.full_name, email:c.email||'', phone:c.phone||'',
      source:c.source||'Job Portal', stage:c.stage, interview_date:c.interview_date||'', notes:c.notes||'' })
    setEditId(c.id); setShowModal(true)
  }

  async function save(){
    if(!form.full_name){ alert('Nama kandidat wajib diisi'); return }
    setSaving(true)
    try{
      if(editId){
        const res=await fetch('/api/candidates',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editId,...form})})
        const data=await res.json();if(!res.ok)throw new Error(data.error)
        setCands(prev=>prev.map(c=>c.id===editId?{...data.data}:c))
      }else{
        const res=await fetch('/api/candidates',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,recruitment_id:job.id})})
        const data=await res.json();if(!res.ok)throw new Error(data.error)
        setCands(prev=>[data.data,...prev])
      }
      setShowModal(false)
    }catch(err:any){alert('Error: '+err.message)}
    setSaving(false)
  }

  async function del(id:string,name:string){
    if(!confirm(`Hapus kandidat "${name}"?`))return
    await fetch(`/api/candidates?id=${id}`,{method:'DELETE'})
    setCands(prev=>prev.filter(c=>c.id!==id))
  }

  async function updateStage(id:string,stage:string){
    const res=await fetch('/api/candidates',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,stage})})
    if(res.ok)setCands(prev=>prev.map(c=>c.id===id?{...c,stage}:c))
  }

  async function toggleQuickCall(){
    const next=!quickCallDone
    setQuickCallDone(next)
    if(next){
      // Save a quick call record
      const res=await fetch('/api/candidates',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({full_name:'Quick Call',stage:'Quick Call',recruitment_id:job.id,source:'Internal',notes:'Quick call sudah dilakukan'})})
      const data=await res.json()
      if(res.ok&&data.data) setCands(prev=>[data.data,...prev])
    } else {
      // Remove quick call records
      const qc=cands.filter(c=>c.stage==='Quick Call')
      for(const c of qc){
        await fetch(`/api/candidates?id=${c.id}`,{method:'DELETE'})
      }
      setCands(prev=>prev.filter(c=>c.stage!=='Quick Call'))
    }
  }

  function exportXls(){
    const rows=cands.filter(c=>c.stage!=='Quick Call').map(c=>({'Nama':c.full_name,'Email':c.email||'','No HP':c.phone||'','Source':c.source||'','Stage':c.stage,'Tgl Interview':c.interview_date||'','Catatan':c.notes||''}))
    const ws=XLSX.utils.json_to_sheet(rows);const wb=XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb,ws,'Kandidat')
    XLSX.writeFile(wb,`kandidat-${job.position.replace(/\s+/g,'-')}.xlsx`)
  }

  const STATUS_FLOW=['Open','Screening','Interview','Offering','OL Signed','Joined','On Hold','Cancelled']

  return(
    <div className="space-y-5">
      <button onClick={()=>router.push('/recruitment')} className="flex items-center gap-2 text-[12.5px] text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft size={15}/> Kembali ke Recruitment
      </button>

      {/* Job header */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="text-[20px] font-bold text-slate-800">{job.position}</div>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <Badge variant="navy">{job.division}</Badge>
              <Badge variant="gray">{job.entity}</Badge>
              <Badge variant="gray">{job.hiring_source||'–'}</Badge>
              <span className="text-[12px] text-slate-400">PIC: <strong className="text-slate-700">{job.pic_name||'–'}</strong></span>
              <span className="text-[12px] text-slate-400">Request: <strong className="text-slate-700">{fmtDate(job.request_date)||fmtDate(job.created_at)}</strong></span>
              {job.ol_signed_date&&<span className="text-[12px] text-teal-600 font-semibold">OL Signed: {fmtDate(job.ol_signed_date)}</span>}
              {(job.join_date||job.target_date)&&<span className="text-[12px] text-slate-400">Join: <strong className="text-slate-700">{fmtDate(job.join_date||job.target_date)}</strong></span>}
            </div>
          </div>
          <select defaultValue={job.hiring_process||job.status} onChange={async e=>{
            await fetch('/api/recruitment',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:job.id,hiring_process:e.target.value})})
          }} className="form-input !w-auto py-1.5 text-[12px] flex-shrink-0">
            {STATUS_FLOW.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        {job.remarks&&<div className="mt-3 text-[12.5px] text-slate-500 bg-slate-50 rounded-lg px-4 py-2.5">{job.remarks}</div>}
      </div>

      {/* Pipeline progress visual */}
      <div className="card p-5">
        <div className="text-[13px] font-semibold text-slate-700 mb-5">Pipeline Progress</div>
        <div className="flex items-start">
          {STAGE_ORDER.map((s,i)=>{
            const count  = s==='Quick Call' ? (quickCallDone?1:0) : (stageCounts[s]||0)
            const isDone = i<=furthestIdx || (s==='Quick Call'&&quickCallDone)
            const isCur  = i===furthestIdx
            const isCheck= s==='Quick Call'

            return(
              <div key={s} className="flex items-start flex-1">
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <button onClick={()=>isCheck?toggleQuickCall():setFilterStage(filterStage===s?'':s)}
                    className={cn('w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold transition-all border-2',
                      s==='Hired'
                        ?(count>0?'bg-teal-500 border-teal-500 text-white shadow-md':'bg-white border-slate-200 text-slate-400')
                        :isCur?'bg-[#0f1e3d] border-[#0f1e3d] text-white ring-4 ring-[#0f1e3d]/15 shadow-md'
                        :isDone?'bg-teal-500 border-teal-500 text-white'
                        :'bg-white border-slate-200 text-slate-300')}>
                    {isCheck?(isDone?'✓':'?'):count>0?count:i+1}
                  </button>
                  <div className={cn('text-[10.5px] font-semibold mt-2 text-center leading-tight px-1',
                    s==='Hired'?(count>0?'text-teal-600':'text-slate-400')
                    :isCur?'text-[#0f1e3d]'
                    :isDone?'text-teal-600':'text-slate-400')}>
                    {s}
                  </div>
                  {!isCheck&&count>0&&(
                    <div className="text-[10px] text-slate-400 mt-0.5">{count} orang</div>
                  )}
                  {isCheck&&(
                    <div className={cn('text-[10px] mt-0.5 font-medium',isDone?'text-teal-500':'text-slate-300')}>
                      {isDone?'✓ Selesai':'Belum'}
                    </div>
                  )}
                </div>
                {i<STAGE_ORDER.length-1&&(
                  <div className={cn('h-0.5 flex-shrink-0 mt-5 transition-all',
                    (i<furthestIdx||(i===STAGE_ORDER.indexOf('Quick Call')&&quickCallDone))?'bg-teal-400':'bg-slate-200'
                  )} style={{width:'calc(100% - 40px)',maxWidth:60}}/>
                )}
              </div>
            )
          })}
        </div>

        {/* Hired names */}
        {hired.length>0&&(
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-teal-600 mb-2">Kandidat yang Diterima ({hired.length})</div>
            <div className="flex flex-wrap gap-2">
              {hired.map(c=>(
                <div key={c.id} className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-3 py-2">
                  <Avatar name={c.full_name} size="sm"/>
                  <div>
                    <div className="text-[12.5px] font-semibold text-teal-800">{c.full_name}</div>
                    {c.interview_date&&<div className="text-[10.5px] text-teal-500">Join: {fmtDate(c.interview_date)}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stage filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={()=>setFilterStage('')}
          className={cn('px-3.5 py-1.5 rounded-lg text-[12px] font-semibold border transition-all',
            !filterStage?'bg-[#0f1e3d] text-white border-[#0f1e3d]':'bg-white text-slate-500 border-slate-200 hover:border-slate-400')}>
          Semua ({cands.filter(c=>c.stage!=='Quick Call').length})
        </button>
        {NAME_STAGES.map(s=>(
          <button key={s} onClick={()=>setFilterStage(filterStage===s?'':s)}
            className={cn('px-3.5 py-1.5 rounded-lg text-[12px] font-semibold border transition-all',
              filterStage===s?'bg-[#0f1e3d] text-white border-[#0f1e3d]':'bg-white text-slate-500 border-slate-200 hover:border-slate-400')}>
            {s}{stageCounts[s]>0?` (${stageCounts[s]})` :''}
          </button>
        ))}
        <button onClick={()=>setFilterStage(filterStage==='Hired'?'':'Hired')}
          className={cn('px-3.5 py-1.5 rounded-lg text-[12px] font-semibold border transition-all',
            filterStage==='Hired'?'bg-teal-600 text-white border-teal-600':'bg-white text-teal-600 border-teal-200 hover:border-teal-400')}>
          Hired {hired.length>0&&`(${hired.length})`}
        </button>
        {rejected.length>0&&(
          <button onClick={()=>setFilterStage(filterStage==='Rejected'?'':'Rejected')}
            className={cn('px-3.5 py-1.5 rounded-lg text-[12px] font-semibold border transition-all',
              filterStage==='Rejected'?'bg-red-600 text-white border-red-600':'bg-white text-red-500 border-red-200 hover:border-red-400')}>
            Rejected ({rejected.length})
          </button>
        )}
      </div>

      {/* Candidates table */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">{filterStage?`${filterStage}`:`Semua Kandidat`} — {job.position}</span>
          <div className="flex items-center gap-2">
            <button onClick={exportXls} className="btn btn-ghost btn-sm"><Download size={12}/> Export</button>
            <button onClick={()=>openAdd(filterStage&&filterStage!=='Rejected'&&filterStage!=='Hired'?filterStage:'Psikotest')} className="btn btn-teal btn-sm">
              <Plus size={12}/> Tambah Kandidat
            </button>
          </div>
        </div>
        <table className="tbl">
          <thead><tr>
            <th>Nama Kandidat</th><th>Kontak</th><th>Source</th>
            <th>Stage</th><th>Tgl Interview</th><th>Catatan</th>
            <th className="text-center">Aksi</th>
          </tr></thead>
          <tbody>
            {displayCands.map(c=>(
              <>
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Avatar name={c.full_name} size="sm"/>
                      <div>
                        <div className="font-semibold text-[12.5px]">{c.full_name}</div>
                      </div>
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
                      {ALL_STAGES.filter(s=>s!=='Quick Call').map(s=><option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="text-[12px] text-slate-400">{fmtDate(c.interview_date)||'–'}</td>
                  <td className="text-[12px] text-slate-500 max-w-[200px]"><span className="line-clamp-1">{c.notes||'–'}</span></td>
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={()=>setExpanded(expanded===c.id?null:c.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400">
                        {expanded===c.id?<ChevronUp size={12}/>:<ChevronDown size={12}/>}
                      </button>
                      <button onClick={()=>openEdit(c)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400"><Pencil size={12}/></button>
                      <button onClick={()=>del(c.id,c.full_name)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-500 text-slate-400"><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
                {expanded===c.id&&c.notes&&(
                  <tr key={c.id+'_exp'}>
                    <td colSpan={7} className="bg-slate-50 px-5 py-3 text-[12px] text-slate-600">
                      <strong>Catatan:</strong> {c.notes}
                    </td>
                  </tr>
                )}
              </>
            ))}
            {displayCands.length===0&&<EmptyState message="Belum ada kandidat di stage ini"/>}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal&&(
        <Modal title={editId?'Edit Kandidat':'Tambah Kandidat'} onClose={()=>setShowModal(false)}>
          <div className="space-y-3">
            <div><label className="form-label">Stage</label>
              <select value={form.stage} onChange={e=>fv('stage',e.target.value)} className="form-input">
                {NAME_STAGES.map(s=><option key={s}>{s}</option>)}
                <option>Hired</option><option>Rejected</option>
              </select>
            </div>
            <div><label className="form-label">Nama Kandidat *</label>
              <input value={form.full_name} onChange={e=>fv('full_name',e.target.value)} className="form-input" placeholder="Nama lengkap"/>
            </div>
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
              <div><label className="form-label">Tanggal Interview</label>
                <input type="date" value={form.interview_date} onChange={e=>fv('interview_date',e.target.value)} className="form-input"/>
              </div>
            </div>
            <div><label className="form-label">Catatan</label>
              <textarea value={form.notes} onChange={e=>fv('notes',e.target.value)} className="form-input h-16 resize-none" placeholder="Catatan tentang kandidat..."/>
            </div>
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
