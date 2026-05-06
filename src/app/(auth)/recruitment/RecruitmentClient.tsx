'use client'
import { useState, useRef } from 'react'
import { Plus, Pencil, Trash2, Search, ChevronRight, Download, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { KPICard, Badge, EmptyState } from '@/components/ui'
import { fmtDate, cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import * as XLSX from 'xlsx'

const EMPTY = { position:'', division:'Creative', entity:'SSR', pic_name:'', hiring_source:'Job Portal', quarter:'Q2', year:2026, status:'Open', total_applicants:0, screening_count:0, interview_count:0, offering_count:0, request_date:'', target_date:'', notes:'' }
const STATUS_FLOW = ['Open','In Progress','Offering','Hired','On Hold','Cancelled']
const SC: Record<string,string> = { Open:'blue','In Progress':'amber',Offering:'purple',Hired:'teal','On Hold':'gray',Cancelled:'gray' }

export default function RecruitmentClient({ recruitment: init }: { recruitment: any[] }) {
  const router = useRouter()
  const [rec, setRec] = useState(init)
  const [search, setSearch] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const fv = (k:string,v:any) => setForm((p:any)=>({...p,[k]:v}))
  const flash = (t:string) => { setMsg(t); setTimeout(()=>setMsg(''),4000) }

  const open = rec.filter(r=>['Open','In Progress','Offering'].includes(r.status))
  const filtered = rec.filter(r=>
    (!search||r.position.toLowerCase().includes(search.toLowerCase())||r.division.toLowerCase().includes(search.toLowerCase())||(r.pic_name||'').toLowerCase().includes(search.toLowerCase()))&&
    (!fStatus||r.status===fStatus)
  )

  function openAdd() { setForm({...EMPTY}); setEditId(null); setShowModal(true) }
  function openEdit(r:any) {
    setForm({ position:r.position, division:r.division, entity:r.entity, pic_name:r.pic_name||'',
      hiring_source:r.hiring_source||'Job Portal', quarter:r.quarter||'Q2', year:r.year||2026,
      status:r.status, total_applicants:r.total_applicants||0, screening_count:r.screening_count||0,
      interview_count:r.interview_count||0, offering_count:r.offering_count||0,
      request_date:r.request_date||'', target_date:r.target_date||'', notes:r.notes||'' })
    setEditId(r.id); setShowModal(true)
  }

  async function save() {
    if (!form.position) { alert('Nama posisi wajib diisi'); return }
    setSaving(true)
    try {
      if (editId) {
        const res=await fetch('/api/recruitment',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editId,...form})})
        const data=await res.json(); if(!res.ok)throw new Error(data.error)
        setRec(prev=>prev.map(r=>r.id===editId?data.data:r))
      } else {
        const res=await fetch('/api/recruitment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
        const data=await res.json(); if(!res.ok)throw new Error(data.error)
        setRec(prev=>[data.data,...prev])
      }
      setShowModal(false); flash('✓ Berhasil disimpan')
    } catch(err:any){alert('Error: '+err.message)}
    setSaving(false)
  }

  async function del(id:string) {
    if (!confirm('Hapus posisi ini?')) return
    await fetch(`/api/recruitment?id=${id}`,{method:'DELETE'})
    setRec(prev=>prev.filter(r=>r.id!==id))
    flash('✓ Posisi dihapus')
  }

  async function updateCount(id:string,field:string,val:number){
    const res=await fetch('/api/recruitment',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,[field]:val})})
    if(res.ok)setRec(prev=>prev.map(r=>r.id===id?{...r,[field]:val}:r))
  }

  async function updateStatus(id:string,status:string){
    const res=await fetch('/api/recruitment',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status})})
    if(res.ok)setRec(prev=>prev.map(r=>r.id===id?{...r,status}:r))
  }

  function exportXls(){
    const rows=filtered.map(r=>({'Posisi':r.position,'Divisi':r.division,'Entitas':r.entity,'PIC HC':r.pic_name||'','Source':r.hiring_source||'','Quarter':r.quarter,'Status':r.status,'Applicants':r.total_applicants,'Screening':r.screening_count,'Interview':r.interview_count,'Offering':r.offering_count,'Request Date':r.request_date||'','Target Date':r.target_date||'','Catatan':r.notes||''}))
    const ws=XLSX.utils.json_to_sheet(rows);const wb=XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb,ws,'Recruitment');XLSX.writeFile(wb,`recruitment-5758-${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  async function importXls(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return
    flash('Membaca file...')
    try{
      const buf=await file.arrayBuffer();const wb=XLSX.read(buf)
      const rows:any[]=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
      for(const row of rows){
        const payload={position:row['Posisi']||'',division:row['Divisi']||'Creative',entity:row['Entitas']||'SSR',pic_name:row['PIC HC']||'',hiring_source:row['Source']||'Job Portal',quarter:row['Quarter']||'Q2',year:2026,status:row['Status']||'Open',total_applicants:row['Applicants']||0,screening_count:row['Screening']||0,interview_count:row['Interview']||0,offering_count:row['Offering']||0,target_date:row['Target Date']||'',notes:row['Catatan']||''}
        if(!payload.position)continue
        const res=await fetch('/api/recruitment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
        const data=await res.json()
        if(res.ok&&data.data)setRec(prev=>[data.data,...prev])
      }
      flash(`✓ Import selesai`)
    }catch(err:any){flash(`✗ Error: ${err.message}`)}
    if(fileRef.current)fileRef.current.value=''
  }

  return(
    <div className="space-y-5">
      <div className="grid grid-cols-5 gap-3">
        <div className="card p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-lg">{open.length}</div><div><div className="text-[11px] text-slate-400">Open positions</div><div className="text-[13px] font-semibold">aktif</div></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">{rec.filter(r=>r.status==='Hired').length}</div><div><div className="text-[11px] text-slate-400">Hired YTD</div><div className="text-[13px] font-semibold">+2 vs Q1</div></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-lg">34</div><div><div className="text-[11px] text-slate-400">Time to hire</div><div className="text-[13px] font-semibold">hari rata-rata</div></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center text-red-500 font-bold text-lg">52</div><div><div className="text-[11px] text-slate-400">Time to fill</div><div className="text-[13px] font-semibold">hari rata-rata</div></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-lg">{open.reduce((s,r)=>s+r.total_applicants,0)}</div><div><div className="text-[11px] text-slate-400">Total kandidat</div><div className="text-[13px] font-semibold">posisi aktif</div></div></div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="flex items-center gap-3">
            <span className="card-title">Semua posisi</span>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 w-48">
              <Search size={11} className="text-slate-300"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari posisi, divisi, PIC..." className="bg-transparent text-[11.5px] outline-none w-full text-slate-700 placeholder:text-slate-300"/>
            </div>
            <select value={fStatus} onChange={e=>setFStatus(e.target.value)} className="form-input !w-auto py-1.5 text-[11px]">
              <option value="">Semua status</option>{STATUS_FLOW.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            {msg&&<span className={cn('text-[11px] font-medium',msg.startsWith('✓')?'text-teal-600':'text-red-600')}>{msg}</span>}
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={importXls} className="hidden"/>
            <button onClick={()=>fileRef.current?.click()} className="btn btn-ghost btn-sm"><Upload size={12}/> Import</button>
            <button onClick={exportXls} className="btn btn-ghost btn-sm"><Download size={12}/> Export</button>
            <button onClick={openAdd} className="btn btn-teal btn-sm"><Plus size={12}/> Buka posisi</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="tbl" style={{minWidth:960}}>
            <thead><tr>
              <th>Posisi</th><th>Divisi</th><th>PIC HC</th><th>Source</th><th>Request</th>
              <th className="text-center">Applicant</th><th className="text-center">Screening</th>
              <th className="text-center">Interview</th><th className="text-center">Offering</th>
              <th>Target hire</th><th>Status</th><th className="text-center">Aksi</th>
            </tr></thead>
            <tbody>
              {filtered.map(r=>(
                <tr key={r.id}>
                  <td>
                    <button onClick={()=>router.push(`/recruitment/job/${r.id}`)}
                      className="flex items-center gap-1 text-left hover:text-teal-600 transition-colors group">
                      <div>
                        <div className="font-semibold text-[12.5px] group-hover:underline">{r.position}</div>
                        <div className="text-[10.5px] text-slate-400">{r.entity}</div>
                      </div>
                      <ChevronRight size={13} className="text-slate-300 group-hover:text-teal-500"/>
                    </button>
                  </td>
                  <td className="text-[12px] text-slate-500">{r.division}</td>
                  <td className="text-[12px] text-slate-500">{r.pic_name||'–'}</td>
                  <td><Badge variant="gray">{r.hiring_source||'–'}</Badge></td>
                  <td className="text-[12px] text-slate-400">{fmtDate(r.request_date)||fmtDate(r.created_at)}</td>
                  {(['total_applicants','screening_count','interview_count','offering_count'] as const).map(field=>(
                    <td key={field} className="text-center">
                      <input type="number" min={0} value={r[field]}
                        onChange={e=>updateCount(r.id,field,parseInt(e.target.value)||0)}
                        className="w-14 text-center text-[13px] font-semibold bg-slate-50 border border-slate-200 rounded-lg py-1 outline-none focus:border-teal-400"/>
                    </td>
                  ))}
                  <td className="text-[12px] text-slate-400">{fmtDate(r.target_date)||'–'}</td>
                  <td>
                    <select value={r.status} onChange={e=>updateStatus(r.id,e.target.value)}
                      className={cn('badge border cursor-pointer outline-none bg-transparent text-[10.5px] font-semibold appearance-none',`badge-${SC[r.status]??'gray'}`)}>
                      {STATUS_FLOW.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td><div className="flex items-center justify-center gap-1">
                    <button onClick={()=>openEdit(r)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400"><Pencil size={12}/></button>
                    <button onClick={()=>del(r.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-500 text-slate-400"><Trash2 size={12}/></button>
                  </div></td>
                </tr>
              ))}
              {filtered.length===0&&<EmptyState message="Tidak ada posisi"/>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal&&(
        <Modal title={editId?'Edit posisi':'Buka posisi baru'} onClose={()=>setShowModal(false)} size="lg">
          <div className="space-y-3">
            <div><label className="form-label">Nama posisi *</label><input value={form.position} onChange={e=>fv('position',e.target.value)} className="form-input" placeholder="e.g. Social Media Specialist"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Divisi</label>
                <select value={form.division} onChange={e=>fv('division',e.target.value)} className="form-input">
                  {['Creative','Marketing','Social Media','Human Capital','Finance','IT & Systems','Operations'].map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div><label className="form-label">Entitas</label>
                <select value={form.entity} onChange={e=>fv('entity',e.target.value)} className="form-input">
                  <option>SSR</option><option>Nyambee (PAT)</option><option>PAT-5758</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">PIC HC</label><input value={form.pic_name} onChange={e=>fv('pic_name',e.target.value)} className="form-input" placeholder="Nama HR yang handle"/></div>
              <div><label className="form-label">Source hiring</label>
                <select value={form.hiring_source} onChange={e=>fv('hiring_source',e.target.value)} className="form-input">
                  {['Job Portal','LinkedIn','Referral','Internal','Headhunter'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="form-label">Tgl request</label><input type="date" value={form.request_date} onChange={e=>fv('request_date',e.target.value)} className="form-input"/></div>
              <div><label className="form-label">Target hire</label><input type="date" value={form.target_date} onChange={e=>fv('target_date',e.target.value)} className="form-input"/></div>
              <div><label className="form-label">Status</label>
                <select value={form.status} onChange={e=>fv('status',e.target.value)} className="form-input">
                  {STATUS_FLOW.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div><label className="form-label">Catatan</label><textarea value={form.notes} onChange={e=>fv('notes',e.target.value)} className="form-input h-16 resize-none" placeholder="Info tambahan tentang posisi ini..."/></div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={()=>setShowModal(false)} className="btn btn-ghost">Batal</button>
              <button onClick={save} disabled={saving} className="btn btn-teal">{saving?'Menyimpan...':editId?'Update':'Buka posisi'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
