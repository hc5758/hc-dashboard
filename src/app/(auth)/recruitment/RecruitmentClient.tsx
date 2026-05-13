'use client'
import { useState, useRef } from 'react'
import BulkBar from '@/components/ui/BulkBar'
import { useBulkSelect } from '@/lib/useBulkSelect'
import { Plus, Pencil, Trash2, Search, ChevronRight, Download, Upload, CheckCircle2, Circle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Badge, EmptyState, TemplateBtn } from '@/components/ui'
import { fmtDate, cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import * as XLSX from 'xlsx'

const HIRING_PROCESS = ['Open','Screening','Interview','Offering','OL Signed','Joined','On Hold','Cancelled']
const PROCESS_COLOR: Record<string,string> = {
  Open:'blue', Screening:'amber', Interview:'purple', Offering:'purple',
  'OL Signed':'teal', Joined:'teal', 'On Hold':'gray', Cancelled:'gray'
}

// Progress stages for the visual bar
const PROGRESS_STAGES = ['Open','Screening','Interview','Offering','OL Signed','Joined']
const PROGRESS_PCT: Record<string,number> = {
  Open:5, Screening:25, Interview:50, Offering:70, 'OL Signed':85, Joined:100, 'On Hold':0, Cancelled:0
}

const EMPTY = {
  position:'', division:'Creative', entity:'SSR', pic_name:'',
  hiring_source:'Job Portal', quarter:'Q2', year:2026,
  request_date:'', ol_signed_date:'', join_date:'',
  hiring_process:'Open', on_progress_hiring:'',
  budget_allocation:0, remarks:'', notes:'', status:'Open', target_date:''
}

export default function RecruitmentClient({ recruitment: init }: { recruitment: any[] }) {
  const router = useRouter()
  const [rec, setRec] = useState(init)
  const bulk = useBulkSelect()
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [fProcess, setFProcess] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const fv = (k:string,v:any) => setForm((p:any)=>({...p,[k]:v}))
  const flash = (t:string)=>{setMsg(t);setTimeout(()=>setMsg(''),4000)}

  const filtered = rec.filter(r=>
    (!search||r.position.toLowerCase().includes(search.toLowerCase())||(r.pic_name||'').toLowerCase().includes(search.toLowerCase())||(r.division||'').toLowerCase().includes(search.toLowerCase()))&&
    (!fProcess||(r.hiring_process||r.status)===fProcess)
  )

  const open    = rec.filter(r=>!['Joined','Cancelled'].includes(r.hiring_process||r.status))
  const joined  = rec.filter(r=>r.hiring_process==='Joined'||r.status==='Hired')
  const olSigned= rec.filter(r=>r.hiring_process==='OL Signed')
  const totalBudget = rec.reduce((s,r)=>s+(r.budget_allocation||0),0)

  function openAdd(){ setForm({...EMPTY}); setEditId(null); setShowModal(true) }
  function openEdit(r:any){
    setForm({
      position:r.position||'', division:r.division||'Creative', entity:r.entity||'SSR',
      pic_name:r.pic_name||'', hiring_source:r.hiring_source||'Job Portal',
      quarter:r.quarter||'Q2', year:r.year||2026,
      request_date:r.request_date||'', ol_signed_date:r.ol_signed_date||'',
      join_date:r.join_date||r.target_date||'',
      hiring_process:r.hiring_process||r.status||'Open',
      on_progress_hiring:r.on_progress_hiring||'',
      budget_allocation:r.budget_allocation||0,
      remarks:r.remarks||'', notes:r.notes||'',
      status:r.status||'Open', target_date:r.target_date||''
    })
    setEditId(r.id); setShowModal(true)
  }

  async function save(){
    if(!form.position){alert('Nama posisi wajib diisi');return}
    setSaving(true)
    try{
      const DATE_FIELDS = ['request_date','ol_signed_date','join_date','target_date']
      const cleanForm = {...form}
      DATE_FIELDS.forEach(f=>{ if(cleanForm[f]==='') cleanForm[f]=null })
      const payload={...cleanForm,
        status:form.hiring_process==='Joined'?'Hired':form.hiring_process==='OL Signed'?'Offering':['Open','Screening','Interview'].includes(form.hiring_process)?'In Progress':form.hiring_process,
        notes:form.remarks||form.notes
      }
      if(editId){
        const res=await fetch('/api/recruitment',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editId,...payload})})
        const data=await res.json();if(!res.ok)throw new Error(data.error)
        setRec(prev=>prev.map(r=>r.id===editId?{...data.data,...form,id:editId}:r))
      }else{
        const res=await fetch('/api/recruitment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
        const data=await res.json();if(!res.ok)throw new Error(data.error)
        setRec(prev=>[{...data.data,...form,id:data.data.id},...prev])
      }
      setShowModal(false);flash('✓ Berhasil disimpan')
    }catch(err:any){alert('Error: '+err.message)}
    setSaving(false)
  }

  async function del(id:string){
    if(!confirm('Hapus posisi ini?'))return
    await fetch(`/api/recruitment?id=${id}`,{method:'DELETE'})
    setRec(prev=>prev.filter(r=>r.id!==id))
    bulk.clear([id])
    flash('✓ Posisi dihapus')
  }

  async function bulkDel(){
    if(bulk.count===0) return
    if(!confirm(`Hapus ${bulk.count} posisi yang dipilih?`)) return
    setBulkDeleting(true)
    const ids=[...bulk.checkedIds]
    await Promise.all(ids.map(id=>fetch(`/api/recruitment?id=${id}`,{method:'DELETE'})))
    setRec(prev=>prev.filter(r=>!ids.includes(r.id)))
    bulk.clear(); setBulkDeleting(false); flash(`✓ ${ids.length} posisi dihapus`)
  }

  async function updateField(id:string,field:string,val:any){
    const res=await fetch('/api/recruitment',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,[field]:val})})
    if(res.ok)setRec(prev=>prev.map(r=>r.id===id?{...r,[field]:val}:r))
  }

  function exportXls(){
    const rows=filtered.map(r=>({'Position':r.position,'Division':r.division||'','Entity':r.entity||'','Closing Name (PIC HC)':r.pic_name||'','Request Date':r.request_date||'','OL Signed Date':r.ol_signed_date||'','Join Date':r.join_date||r.target_date||'','Hiring Process':r.hiring_process||r.status||'','On Progress Hiring':r.on_progress_hiring||'','Remarks':r.remarks||r.notes||'','Budget Allocation':r.budget_allocation||0,'Notes':r.notes||'','Source':r.hiring_source||''}))
    const ws=XLSX.utils.json_to_sheet(rows);ws['!cols']=[{wch:25},{wch:15},{wch:10},{wch:20},{wch:15},{wch:15},{wch:15},{wch:18},{wch:22},{wch:25},{wch:18},{wch:25},{wch:12}]
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Recruitment')
    XLSX.writeFile(wb,`recruitment-5758-${new Date().toISOString().slice(0,10)}.xlsx`);flash('✓ Export berhasil')
  }

  async function importXls(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return
    flash('Membaca file...')
    try{
      const buf=await file.arrayBuffer();const wb=XLSX.read(buf, { cellDates: true })
      const rows:any[]=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: false, dateNF: 'yyyy-mm-dd' })
      const normD=(v:any)=>v instanceof Date?`${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}-${String(v.getDate()).padStart(2,'0')}`:v
      const normalizedRows=rows.map((r:any)=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,normD(v)])))
      let count=0
      for(const row of normalizedRows){
        if(!row['Position'])continue
        const hp=row['Hiring Process']||'Open'
        const parseD=(v:any)=>{ if(!v)return null; const s=String(v).trim(); if(s.includes('T'))return s.slice(0,10); if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s; return null }
        const payload={position:row['Position'],division:row['Division']||'Creative',entity:row['Entity']||'SSR',pic_name:row['Closing Name (PIC HC)']||'',hiring_source:row['Source']||'Job Portal',request_date:parseD(row['Request Date']),ol_signed_date:parseD(row['OL Signed Date']),target_date:parseD(row['Join Date']),join_date:parseD(row['Join Date']),hiring_process:hp,on_progress_hiring:row['On Progress Hiring']||'',remarks:row['Remarks']||'',notes:row['Notes']||'',budget_allocation:parseFloat(row['Budget Allocation'])||0,status:hp==='Joined'?'Hired':hp==='OL Signed'?'Offering':'In Progress',quarter:'Q2',year:2026}
        const res=await fetch('/api/recruitment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
        const data=await res.json()
        if(res.ok&&data.data){setRec(prev=>[{...data.data,...payload,id:data.data.id},...prev]);count++}
      }
      flash(`✓ ${count} posisi berhasil diimport`)
    }catch(err:any){flash(`✗ Error: ${err.message}`)}
    if(fileRef.current)fileRef.current.value=''
  }

  return(
    <div className="space-y-5">
      {/* KPIs - typography proper */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { value: open.length,      label: 'Posisi Aktif',       sub: `dari ${rec.length} total`,     color: 'text-teal-600',   bg: 'bg-teal-50' },
          { value: olSigned.length,  label: 'OL Signed',          sub: 'Menunggu Join',               color: 'text-blue-600',   bg: 'bg-blue-50' },
          { value: joined.length,    label: 'Joined YTD',         sub: 'Berhasil Hired',              color: 'text-purple-600', bg: 'bg-purple-50' },
          { value: totalBudget>0?`Rp ${Math.round(totalBudget/1_000_000)} Jt`:'–', label: 'Budget Allocation', sub: 'Total Posisi', color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((k,i)=>(
          <div key={i} className="card p-4 flex items-center gap-4">
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl flex-shrink-0', k.bg, k.color)}>
              {k.value}
            </div>
            <div>
              <div className="text-[13px] font-semibold text-slate-800">{k.label}</div>
              <div className="text-[11.5px] text-slate-400 mt-0.5">{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main table */}
      <div className="card">
        <div className="card-head">
          <div className="flex items-center gap-3">
            <span className="card-title">Tracking Recruitment</span>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 w-52">
              <Search size={11} className="text-slate-300"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari posisi, PIC, divisi..." className="bg-transparent text-[11.5px] outline-none w-full text-slate-700 placeholder:text-slate-300"/>
            </div>
            <select value={fProcess} onChange={e=>setFProcess(e.target.value)} className="form-input !w-auto py-1.5 text-[11.5px]">
              <option value="">Semua Status</option>
              {HIRING_PROCESS.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            {msg&&<span className={cn('text-[11px] font-medium',msg.startsWith('✓')?'text-teal-600':'text-red-600')}>{msg}</span>}
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={importXls} className="hidden"/>
            <TemplateBtn sheet="Recruitment"/>
            <button onClick={()=>fileRef.current?.click()} className="btn btn-ghost btn-sm"><Upload size={12}/> Import</button>
            <button onClick={exportXls} className="btn btn-ghost btn-sm"><Download size={12}/> Export</button>
            <BulkBar count={bulk.count} onDelete={bulkDel} deleting={bulkDeleting} label="posisi"/>
            <button onClick={openAdd} className="btn btn-teal btn-sm"><Plus size={12}/> Tambah Posisi</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="tbl" style={{minWidth:1000}}>
            <thead>
              <tr style={{background:'#0f1e3d'}}>
                {['Position','PIC HC','Request Date','OL Signed Date','Join Date','Hiring Progress','Hiring Process','On Progress Hiring','Budget','Notes','Closing Name','Aksi'].map(h=>(
                  <th key={h} style={{color:'rgba(255,255,255,0.7)',background:'#0f1e3d',borderColor:'#1a2d5a',fontSize:'10.5px',fontWeight:600,letterSpacing:'0.04em',textTransform:'uppercase',textAlign:h==='Aksi'?'center':'left'}}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r=>{
                const hp = r.hiring_process||r.status||'Open'
                const pct = PROGRESS_PCT[hp]??0
                const isDone = hp==='Joined'
                const isActive = !['On Hold','Cancelled',''].includes(hp)

                return(
                  <tr key={r.id} className={bulk.isChecked(r.id)?"bg-blue-50/50":""}>
                    <td className="text-center w-8"><input type="checkbox" className="w-3.5 h-3.5 rounded accent-teal-500 cursor-pointer" checked={bulk.isChecked(r.id)} onChange={()=>bulk.toggle(r.id)}/></td>
                    {/* Position — klik masuk detail */}
                    <td style={{minWidth:180}}>
                      <button onClick={()=>router.push(`/recruitment/job/${r.id}`)}
                        className="flex items-center gap-1.5 text-left hover:text-teal-600 transition-colors group w-full">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[12.5px] group-hover:underline leading-tight">{r.position}</div>
                          <div className="text-[10.5px] text-slate-400 mt-0.5">{r.division} · {r.entity}</div>
                        </div>
                        <ChevronRight size={12} className="text-slate-300 group-hover:text-teal-500 flex-shrink-0"/>
                      </button>
                    </td>

                    {/* PIC HC — yang ngurus */}
                    <td style={{minWidth:130}}>
                      <input defaultValue={r.pic_name||''} onBlur={e=>updateField(r.id,'pic_name',e.target.value)}
                        className="text-[12.5px] text-slate-700 font-medium bg-transparent outline-none border-b border-transparent hover:border-slate-200 focus:border-teal-400 w-full py-0.5"
                        placeholder="Nama PIC..."/>
                    </td>

                    {/* Request Date — inline edit */}
                    <td style={{minWidth:120}}>
                      <input type="date" defaultValue={r.request_date||''} onBlur={e=>updateField(r.id,'request_date',e.target.value)}
                        className="text-[12px] text-slate-600 bg-transparent outline-none border-b border-transparent hover:border-slate-200 focus:border-teal-400 w-[108px] py-0.5"/>
                    </td>

                    {/* OL Signed Date */}
                    <td style={{minWidth:120}}>
                      <input type="date" defaultValue={r.ol_signed_date||''} onBlur={e=>updateField(r.id,'ol_signed_date',e.target.value)}
                        className={cn('text-[12px] bg-transparent outline-none border-b border-transparent hover:border-slate-200 focus:border-teal-400 w-[108px] py-0.5',r.ol_signed_date?'text-teal-600 font-medium':'text-slate-300')}/>
                    </td>

                    {/* Join Date */}
                    <td style={{minWidth:120}}>
                      <input type="date" defaultValue={r.join_date||r.target_date||''} onBlur={e=>updateField(r.id,'join_date',e.target.value)}
                        className={cn('text-[12px] bg-transparent outline-none border-b border-transparent hover:border-slate-200 focus:border-teal-400 w-[108px] py-0.5',(r.join_date||r.target_date)?'text-slate-600':'text-slate-300')}/>
                    </td>

                    {/* Progress bar visual */}
                    <td style={{minWidth:200}}>
                      {hp==='On Hold'||hp==='Cancelled'?(
                        <Badge variant={hp==='On Hold'?'amber':'gray'}>{hp}</Badge>
                      ):(
                        <div>
                          {/* Stage dots */}
                          <div className="flex items-center gap-0.5 mb-1.5">
                            {PROGRESS_STAGES.map((s,i)=>{
                              const sidx = PROGRESS_STAGES.indexOf(hp)
                              const done = i<=sidx
                              const cur  = i===sidx
                              return(
                                <div key={s} className="flex items-center">
                                  <div className={cn('w-2 h-2 rounded-full transition-all',cur?'w-3 h-3 bg-teal-500 ring-2 ring-teal-200':done?'bg-teal-500':'bg-slate-200')}/>
                                  {i<PROGRESS_STAGES.length-1&&<div className={cn('w-3 h-0.5',done&&i<sidx?'bg-teal-400':'bg-slate-200')}/>}
                                </div>
                              )
                            })}
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1">
                            <div className={cn('h-1.5 rounded-full transition-all',isDone?'bg-teal-500':'bg-[#0f1e3d]')} style={{width:`${pct}%`}}/>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={cn('text-[10px] font-semibold',isDone?'text-teal-600':'text-slate-500')}>{isDone?'✓ Joined':hp}</span>
                            <span className="text-[10px] text-slate-400">{pct}%</span>
                          </div>
                          {/* Nama kalau sudah joined */}
                          {isDone&&r.on_progress_hiring&&(
                            <div className="text-[10px] text-teal-700 font-medium mt-0.5">👤 {r.on_progress_hiring}</div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Hiring Process dropdown */}
                    <td style={{minWidth:110}}>
                      <select value={hp} onChange={e=>updateField(r.id,'hiring_process',e.target.value)}
                        className={cn('badge border cursor-pointer outline-none bg-transparent text-[10.5px] font-semibold appearance-none',`badge-${PROCESS_COLOR[hp]??'gray'}`)}>
                        {HIRING_PROCESS.map(s=><option key={s}>{s}</option>)}
                      </select>
                    </td>

                    {/* Budget */}
                    <td style={{minWidth:90}}>
                      <input type="number" defaultValue={r.budget_allocation||0} onBlur={e=>updateField(r.id,'budget_allocation',parseFloat(e.target.value)||0)}
                        className="text-[12px] text-slate-600 bg-transparent outline-none border-b border-transparent hover:border-slate-200 focus:border-teal-400 w-20 py-0.5"/>
                    </td>

                    {/* Notes */}
                    <td style={{minWidth:130}}>
                      <input defaultValue={r.notes||''} onBlur={e=>updateField(r.id,'notes',e.target.value)}
                        className="text-[12px] text-slate-600 bg-transparent outline-none border-b border-transparent hover:border-slate-200 focus:border-teal-400 w-full py-0.5"
                        placeholder="Catatan..."/>
                    </td>

                    {/* Closing Name — nama kandidat yang akhirnya diclose/hire */}
                    <td style={{minWidth:130}}>
                      <input defaultValue={r.on_progress_hiring||''} onBlur={e=>updateField(r.id,'on_progress_hiring',e.target.value)}
                        className={cn('text-[12px] bg-transparent outline-none border-b border-transparent hover:border-slate-200 focus:border-teal-400 w-full py-0.5',
                          r.on_progress_hiring?'text-teal-700 font-semibold':'text-slate-300')}
                        placeholder="Nama kandidat final..."/>
                    </td>

                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={()=>openEdit(r)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400"><Pencil size={12}/></button>
                        <button onClick={()=>del(r.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-500 text-slate-400"><Trash2 size={12}/></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length===0&&<EmptyState message="Belum ada posisi — klik Tambah Posisi untuk mulai"/>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal&&(
        <Modal title={editId?'Edit Posisi':'Tambah Posisi Baru'} onClose={()=>setShowModal(false)} size="lg">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Position *</label><input value={form.position} onChange={e=>fv('position',e.target.value)} className="form-input" placeholder="e.g. Social Media Specialist"/></div>
              <div><label className="form-label">Closing Name (PIC HC)</label><input value={form.pic_name} onChange={e=>fv('pic_name',e.target.value)} className="form-input" placeholder="Nama HR yang handle"/></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="form-label">Division</label>
                <select value={form.division} onChange={e=>fv('division',e.target.value)} className="form-input">
                  {['Creative','Marketing','Social Media','Human Capital','Finance','IT & Systems','Operations'].map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div><label className="form-label">Entity</label>
                <select value={form.entity} onChange={e=>fv('entity',e.target.value)} className="form-input">
                  <option>SSR</option><option>Nyambee (PAT)</option><option>PAT-5758</option>
                </select>
              </div>
              <div><label className="form-label">Source</label>
                <select value={form.hiring_source} onChange={e=>fv('hiring_source',e.target.value)} className="form-input">
                  {['Job Portal','LinkedIn','Referral','Internal','Headhunter'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="form-label">Request Date</label><input type="date" value={form.request_date} onChange={e=>fv('request_date',e.target.value)} className="form-input"/></div>
              <div><label className="form-label">OL Signed Date</label><input type="date" value={form.ol_signed_date} onChange={e=>fv('ol_signed_date',e.target.value)} className="form-input"/></div>
              <div><label className="form-label">Join Date</label><input type="date" value={form.join_date} onChange={e=>fv('join_date',e.target.value)} className="form-input"/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Hiring Process</label>
                <select value={form.hiring_process} onChange={e=>fv('hiring_process',e.target.value)} className="form-input">
                  {HIRING_PROCESS.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="form-label">On Progress Hiring</label><input value={form.on_progress_hiring} onChange={e=>fv('on_progress_hiring',e.target.value)} className="form-input" placeholder="Nama kandidat / info progress..."/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Budget Allocation (Rp)</label><input type="number" value={form.budget_allocation} onChange={e=>fv('budget_allocation',parseFloat(e.target.value)||0)} className="form-input" min={0}/></div>
              <div><label className="form-label">Quarter</label>
                <select value={form.quarter} onChange={e=>fv('quarter',e.target.value)} className="form-input">
                  <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
                </select>
              </div>
            </div>
            <div><label className="form-label">Remarks</label><input value={form.remarks} onChange={e=>fv('remarks',e.target.value)} className="form-input" placeholder="Keterangan tambahan..."/></div>
            <div><label className="form-label">Notes</label><textarea value={form.notes} onChange={e=>fv('notes',e.target.value)} className="form-input h-14 resize-none" placeholder="Catatan internal..."/></div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={()=>setShowModal(false)} className="btn btn-ghost">Batal</button>
              <button onClick={save} disabled={saving} className="btn btn-teal">{saving?'Menyimpan...':editId?'Update':'Tambah Posisi'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
