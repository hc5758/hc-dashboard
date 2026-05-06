'use client'
import { useState, useRef } from 'react'
import { Search, Download, Upload, Plus, Pencil, Trash2 } from 'lucide-react'
import { KPICard, Badge, StatusBadge, Avatar, InlineBar, InsightCard, EmptyState } from '@/components/ui'
import { fmtDate, calcYoS, statusLabel, cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import * as XLSX from 'xlsx'

const EMPTY: any = {
  employee_id:'',full_name:'',email:'',phone:'',position:'',level:'',
  division:'Creative',entity:'SSR',employment_type:'PKWTT',work_location:'Jakarta',
  status:'active',gender:'Perempuan',birth_date:'',marital_status:'Belum Kawin',
  join_date:'',end_date:'',notes:'',
}
const DIVS=['Creative','Marketing','Social Media','Human Capital','Finance','IT & Systems','Operations']
const LEVELS=['Jr. Staff','Staff','Sr. Staff','Associate','Officer','Sr. Officer','Specialist','Sr. Specialist','Manager','Sr. Manager','Head','Director']

export default function WorkforceClient({ employees: init }: { employees: any[] }) {
  const [employees,setEmployees]=useState(init)
  const [search,setSearch]=useState('')
  const [fStatus,setFStatus]=useState('')
  const [fEntity,setFEntity]=useState('')
  const [fDiv,setFDiv]=useState('')
  const [msg,setMsg]=useState('')
  const [importing,setImporting]=useState(false)
  const [showModal,setShowModal]=useState(false)
  const [editId,setEditId]=useState<string|null>(null)
  const [saving,setSaving]=useState(false)
  const [form,setForm]=useState<any>(EMPTY)
  const fileRef=useRef<HTMLInputElement>(null)
  const fv=(k:string,v:any)=>setForm((p:any)=>({...p,[k]:v}))

  const active=employees.filter(e=>e.status==='active')
  const divs=Array.from(new Set(employees.map(e=>e.division))).sort()
  const entities=Array.from(new Set(employees.map(e=>e.entity))).sort()
  const filtered=employees.filter(e=>
    (!search||e.full_name.toLowerCase().includes(search.toLowerCase())||e.employee_id.toLowerCase().includes(search.toLowerCase())||e.division.toLowerCase().includes(search.toLowerCase()))&&
    (!fStatus||e.status===fStatus)&&(!fEntity||e.entity===fEntity)&&(!fDiv||e.division===fDiv)
  )
  const divCounts=Object.entries(active.reduce((acc:any,e)=>{acc[e.division]=(acc[e.division]||0)+1;return acc},{})).sort((a:any,b:any)=>b[1]-a[1])
  const maxDiv=(divCounts[0]?.[1] as number)||1

  function flash(t:string){setMsg(t);setTimeout(()=>setMsg(''),4000)}
  function openAdd(){setForm({...EMPTY});setEditId(null);setShowModal(true)}
  function openEdit(emp:any){
    setForm({employee_id:emp.employee_id||'',full_name:emp.full_name||'',email:emp.email||'',phone:emp.phone||'',
      position:emp.position||'',level:emp.level||'',division:emp.division||'Creative',entity:emp.entity||'SSR',
      employment_type:emp.employment_type||'PKWTT',work_location:emp.work_location||'Jakarta',status:emp.status||'active',
      gender:emp.gender||'Perempuan',birth_date:emp.birth_date||'',marital_status:emp.marital_status||'',
      join_date:emp.join_date||'',end_date:emp.end_date||'',notes:emp.notes||''})
    setEditId(emp.id);setShowModal(true)
  }

  async function saveEmployee(){
    if(!form.full_name||!form.employee_id||!form.join_date){alert('Nama, Employee ID, dan Join Date wajib diisi.');return}
    setSaving(true)
    try{
      if(editId){
        const res=await fetch('/api/employees',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editId,...form})})
        const data=await res.json()
        if(!res.ok)throw new Error(data.error)
        setEmployees(prev=>prev.map(e=>e.id===editId?data.data:e))
        flash('✓ Data karyawan berhasil diperbarui')
      }else{
        const res=await fetch('/api/employees',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
        const data=await res.json()
        if(!res.ok)throw new Error(data.error)
        setEmployees(prev=>[data.data,...prev])
        flash('✓ Karyawan baru berhasil ditambahkan')
      }
      setShowModal(false)
    }catch(err:any){alert('Error: '+err.message)}
    setSaving(false)
  }

  async function deleteEmployee(id:string,name:string){
    if(!confirm(`Hapus karyawan "${name}"? Tidak bisa dibatalkan.`))return
    const res=await fetch(`/api/employees?id=${id}`,{method:'DELETE'})
    if(res.ok){setEmployees(prev=>prev.filter(e=>e.id!==id));flash('✓ Karyawan berhasil dihapus')}
    else alert('Gagal menghapus')
  }

  function handleExport(){
    const rows=filtered.map(e=>({'Employee ID':e.employee_id,'Nama':e.full_name,'Email':e.email??'','Posisi':e.position,'Level':e.level??'','Divisi':e.division,'Entitas':e.entity,'Tipe':e.employment_type,'Status':statusLabel(e.status),'Gender':e.gender??'','Join Date':e.join_date,'End Date':e.end_date??'','Masa Kerja':calcYoS(e.join_date)}))
    const ws=XLSX.utils.json_to_sheet(rows);const wb=XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb,ws,'Karyawan');XLSX.writeFile(wb,`karyawan-5758-${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  async function handleImport(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return
    setImporting(true);flash('Membaca file...')
    try{
      const buf=await file.arrayBuffer();const wb=XLSX.read(buf)
      const rows:any[]=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
      flash(`${rows.length} baris ditemukan. Mengupload...`)
      const res=await fetch('/api/upload/employees',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rows})})
      const data=await res.json()
      if(!res.ok)throw new Error(data.error)
      flash(`✓ ${data.count} karyawan berhasil diimport!`)
      const fresh=await fetch('/api/employees').then(r=>r.json())
      if(fresh.data)setEmployees(fresh.data)
    }catch(err:any){flash(`✗ Error: ${err.message}`)}
    finally{setImporting(false);if(fileRef.current)fileRef.current.value=''}
  }

  return(
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-3">
        <KPICard label="Total karyawan"  value={employees.length}                                       accent="bg-[#1a2d5a]"/>
        <KPICard label="Aktif"           value={active.length}                          change="+3 MoM" changeType="up"   accent="bg-teal-400"/>
        <KPICard label="PKWTT (tetap)"   value={active.filter(e=>e.employment_type==='PKWTT').length}   accent="bg-blue-400"/>
        <KPICard label="PKWT (kontrak)"  value={active.filter(e=>e.employment_type==='PKWT').length}    accent="bg-amber-400"/>
        <KPICard label="Resign + End OC" value={employees.filter(e=>e.status!=='active').length}        accent="bg-red-400"/>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card">
          <div className="card-head"><span className="card-title">By division</span></div>
          <div className="card-body space-y-2">
            {divCounts.slice(0,8).map(([div,count])=>(
              <InlineBar key={div} label={div as string} value={`${count}`} pct={Math.round((count as number/maxDiv)*100)} color="bg-[#0f1e3d]"/>
            ))}
          </div>
        </div>

        <div className="col-span-3 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-lg px-3 py-1.5 flex-1 min-w-[160px]">
              <Search size={12} className="text-slate-300"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama, ID, divisi..." className="bg-transparent text-[11.5px] outline-none w-full text-slate-800 placeholder:text-slate-300"/>
            </div>
            <select value={fStatus} onChange={e=>setFStatus(e.target.value)} className="form-input !w-auto py-1.5 text-[11px]">
              <option value="">Semua status</option><option value="active">Aktif</option><option value="resigned">Resign</option><option value="end_contract">End OC</option>
            </select>
            <select value={fEntity} onChange={e=>setFEntity(e.target.value)} className="form-input !w-auto py-1.5 text-[11px]">
              <option value="">Semua entitas</option>{entities.map(en=><option key={en}>{en}</option>)}
            </select>
            <select value={fDiv} onChange={e=>setFDiv(e.target.value)} className="form-input !w-auto py-1.5 text-[11px]">
              <option value="">Semua divisi</option>{divs.map(d=><option key={d}>{d}</option>)}
            </select>
            <div className="flex items-center gap-2">
              {msg&&<span className={cn('text-[10.5px] font-medium',msg.startsWith('✓')?'text-teal-600':msg.startsWith('✗')?'text-red-600':'text-amber-600')}>{msg}</span>}
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden"/>
              <button onClick={()=>fileRef.current?.click()} disabled={importing} className="btn btn-ghost btn-sm"><Upload size={12}/> Import</button>
              <button onClick={handleExport} className="btn btn-ghost btn-sm"><Download size={12}/> Export</button>
              <button onClick={openAdd} className="btn btn-teal btn-sm"><Plus size={12}/> Tambah</button>
            </div>
          </div>
          <div className="text-[10.5px] text-slate-300">Menampilkan <strong className="text-slate-800">{filtered.length}</strong> dari {employees.length} karyawan</div>
          <div className="card overflow-x-auto">
            <table className="tbl" style={{minWidth:860}}>
              <thead><tr><th>Karyawan</th><th>Posisi</th><th>Divisi</th><th>Entitas</th><th>Kontrak</th><th>Status</th><th>Join date</th><th>Masa kerja</th><th>End date</th><th className="text-center">Aksi</th></tr></thead>
              <tbody>
                {filtered.map(e=>(
                  <tr key={e.id}>
                    <td><div className="flex items-center gap-2"><Avatar name={e.full_name} size="sm"/><div><div className="font-bold text-[12px]">{e.full_name}</div><div className="text-[10px] text-slate-300">{e.employee_id}</div></div></div></td>
                    <td className="text-[11px] text-slate-600">{e.position}</td>
                    <td className="text-[11px]">{e.division}</td>
                    <td><Badge variant="navy">{e.entity}</Badge></td>
                    <td><Badge variant={e.employment_type==='PKWTT'?'teal':'blue'}>{e.employment_type}</Badge></td>
                    <td><StatusBadge status={e.status}/></td>
                    <td className="text-[11px] text-slate-400">{fmtDate(e.join_date)}</td>
                    <td className="text-[11px]">{calcYoS(e.join_date)}</td>
                    <td className={cn('text-[11px]',e.end_date&&new Date(e.end_date)<new Date(Date.now()+30*86400000)?'text-red-600 font-bold':'text-slate-400')}>{fmtDate(e.end_date)||'–'}</td>
                    <td><div className="flex items-center justify-center gap-1">
                      <button onClick={()=>openEdit(e)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400 transition-colors"><Pencil size={12}/></button>
                      <button onClick={()=>deleteEmployee(e.id,e.full_name)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-400 transition-colors"><Trash2 size={12}/></button>
                    </div></td>
                  </tr>
                ))}
                {filtered.length===0&&<EmptyState message="Tidak ada data yang sesuai filter"/>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InsightCard title="Creative division terbesar" text="Divisi dengan headcount terbanyak. Perlu monitoring beban kerja dan retention strategy khusus."/>
        <InsightCard title="Gender split 59% Perempuan" text="Distribusi gender cukup seimbang. Perempuan mayoritas di Creative dan Social Media." color="bg-[#1a2d5a]" titleColor="text-teal-200"/>
      </div>

      {showModal&&(
        <Modal title={editId?'Edit data karyawan':'Tambah karyawan baru'} onClose={()=>setShowModal(false)} size="lg">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Employee ID *</label><input value={form.employee_id} onChange={e=>fv('employee_id',e.target.value)} className="form-input" placeholder="EMP021" disabled={!!editId}/></div>
              <div><label className="form-label">Nama lengkap *</label><input value={form.full_name} onChange={e=>fv('full_name',e.target.value)} className="form-input" placeholder="Nama karyawan"/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Email</label><input type="email" value={form.email} onChange={e=>fv('email',e.target.value)} className="form-input" placeholder="email@co.id"/></div>
              <div><label className="form-label">No. HP</label><input value={form.phone} onChange={e=>fv('phone',e.target.value)} className="form-input" placeholder="08xx"/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Posisi *</label><input value={form.position} onChange={e=>fv('position',e.target.value)} className="form-input" placeholder="e.g. Graphic Designer"/></div>
              <div><label className="form-label">Level</label>
                <select value={form.level} onChange={e=>fv('level',e.target.value)} className="form-input">
                  <option value="">Pilih level...</option>{LEVELS.map(l=><option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Divisi</label>
                <select value={form.division} onChange={e=>fv('division',e.target.value)} className="form-input">{DIVS.map(d=><option key={d}>{d}</option>)}</select>
              </div>
              <div><label className="form-label">Entitas</label>
                <select value={form.entity} onChange={e=>fv('entity',e.target.value)} className="form-input">
                  <option>SSR</option><option>Nyambee (PAT)</option><option>PAT-5758</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Tipe kontrak</label>
                <select value={form.employment_type} onChange={e=>fv('employment_type',e.target.value)} className="form-input">
                  <option>PKWTT</option><option>PKWT</option>
                </select>
              </div>
              <div><label className="form-label">Status</label>
                <select value={form.status} onChange={e=>fv('status',e.target.value)} className="form-input">
                  <option value="active">Aktif</option><option value="resigned">Resign</option><option value="end_contract">End OC</option><option value="inactive">Tidak Aktif</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Gender</label>
                <select value={form.gender} onChange={e=>fv('gender',e.target.value)} className="form-input"><option>Perempuan</option><option>Laki-laki</option></select>
              </div>
              <div><label className="form-label">Status pernikahan</label>
                <select value={form.marital_status} onChange={e=>fv('marital_status',e.target.value)} className="form-input">
                  <option>Belum Kawin</option><option>Kawin</option><option>Cerai</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="form-label">Tgl lahir</label><input type="date" value={form.birth_date} onChange={e=>fv('birth_date',e.target.value)} className="form-input"/></div>
              <div><label className="form-label">Join date *</label><input type="date" value={form.join_date} onChange={e=>fv('join_date',e.target.value)} className="form-input"/></div>
              <div><label className="form-label">End date</label><input type="date" value={form.end_date} onChange={e=>fv('end_date',e.target.value)} className="form-input"/></div>
            </div>
            <div><label className="form-label">Catatan</label><input value={form.notes} onChange={e=>fv('notes',e.target.value)} className="form-input" placeholder="Opsional..."/></div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={()=>setShowModal(false)} className="btn btn-ghost">Batal</button>
              <button onClick={saveEmployee} disabled={saving} className="btn btn-teal">{saving?'Menyimpan...':editId?'Update':'Tambah karyawan'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
