'use client'
import { useState, useRef } from 'react'
import { Search, Download, Upload, Plus, Pencil, Trash2 } from 'lucide-react'
import { KPICard, Badge, StatusBadge, Avatar, InlineBar, InsightCard, EmptyState, TemplateBtn } from '@/components/ui'
import BulkBar from '@/components/ui/BulkBar'
import { useBulkSelect } from '@/lib/useBulkSelect'
import { fmtDate, calcYoS, statusLabel, cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import * as XLSX from 'xlsx'
const EMPTY: any = {
  employee_id:'',full_name:'',email:'',position:'',level:'',
  division:'Creative',entity:'SSR',employment_type:'PKWTT',work_location:'Jakarta',
  status:'active',gender:'Perempuan',birth_date:'',marital_status:'Belum Kawin',
  join_date:'',end_date:'',notes:'',
}
const DIVS=['Creative','Marketing','Social Media','Human Capital','Finance','IT & Systems','Operations']
const LEVELS=['Jr. Staff','Staff','Sr. Staff','Associate','Officer','Sr. Officer','Specialist','Sr. Specialist','Manager','Sr. Manager','Head','Director']

export default function WorkforceClient({ employees: init }: { employees: any[] }) {
  const [employees,setEmployees]=useState(init)
  const bulk = useBulkSelect()
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [search,setSearch]=useState('')
  const [activeTab, setActiveTab] = useState<'active'|'resigned'|'end_contract'>('active')
  const [fEntity,setFEntity]=useState('')
  const [fDiv,setFDiv]=useState('')
  const [sortCol,setSortCol]=useState<string>('full_name')
  const [sortDir,setSortDir]=useState<'asc'|'desc'>('asc')

  function toggleSort(col:string){
    if(sortCol===col) setSortDir(d=>d==='asc'?'desc':'asc')
    else { setSortCol(col); setSortDir('asc') }
  }
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

  // Chart: semua karyawan per divisi (aktif + non-aktif, sesuai tabel)
  const divCounts=Object.entries(employees.reduce((acc:any,e)=>{acc[e.division]=(acc[e.division]||0)+1;return acc},{})).sort((a:any,b:any)=>b[1]-a[1])
  const maxDiv=(divCounts[0]?.[1] as number)||1

  const filtered = employees
    .filter(e=>
      (!search||e.full_name?.toLowerCase().includes(search.toLowerCase())||e.employee_id?.toLowerCase().includes(search.toLowerCase())||e.division?.toLowerCase().includes(search.toLowerCase()))&&
      e.status===activeTab&&(!fEntity||e.entity===fEntity)&&(!fDiv||e.division===fDiv)
    )
    .sort((a,b)=>{
      let av:any='', bv:any=''
      if(sortCol==='full_name'){av=a.full_name||'';bv=b.full_name||''}
      else if(sortCol==='join_date'){av=a.join_date||'';bv=b.join_date||''}
      else if(sortCol==='end_date'){av=a.end_date||'9999';bv=b.end_date||'9999'}
      else if(sortCol==='division'){av=a.division||'';bv=b.division||''}
      else if(sortCol==='yos'){av=a.join_date||'';bv=b.join_date||'';return sortDir==='asc'?av.localeCompare(bv):bv.localeCompare(av)}
      else if(sortCol==='employee_id'){
        const na=parseInt(a.employee_id?.replace(/\D/g,'')||'0')
        const nb=parseInt(b.employee_id?.replace(/\D/g,'')||'0')
        return sortDir==='asc'?na-nb:nb-na
      }
      if(typeof av==='string') return sortDir==='asc'?av.localeCompare(bv):bv.localeCompare(av)
      return sortDir==='asc'?av-bv:bv-av
    })

  function flash(t:string){setMsg(t);setTimeout(()=>setMsg(''),4000)}
  function openAdd(){
    // Auto-generate next Employee ID
    const ids = employees.map(e=>parseInt(e.employee_id?.replace(/\D/g,'')||'0')).filter(n=>!isNaN(n))
    const nextNum = ids.length > 0 ? Math.max(...ids) + 1 : 1
    const nextId = `EMP${String(nextNum).padStart(3,'0')}`
    setForm({...EMPTY, employee_id: nextId})
    setEditId(null)
    setShowModal(true)
  }
  function openEdit(emp:any){
    setForm({employee_id:emp.employee_id||'',full_name:emp.full_name||'',email:emp.email||'',
      position:emp.position||'',level:emp.level||'',division:emp.division||'Creative',entity:emp.entity||'SSR',
      employment_type:emp.employment_type||'PKWTT',work_location:emp.work_location||'Jakarta',status:emp.status||'active',
      gender:emp.gender||'Perempuan',birth_date:emp.birth_date||'',marital_status:emp.marital_status||'',
      join_date:emp.join_date||'',end_date:emp.end_date||'',notes:emp.notes||''})
    setEditId(emp.id);setShowModal(true)
  }

  async function saveEmployee(){
    if(!form.full_name||!form.employee_id||!form.join_date){alert('Nama, Employee ID, dan Join Date wajib diisi.');return}
    // Validasi duplikat Employee ID (hanya saat tambah baru)
    if(!editId && employees.some(e=>e.employee_id===form.employee_id)){
      alert(`Employee ID "${form.employee_id}" sudah digunakan. Gunakan ID lain.`);return
    }
    setSaving(true)
    try{
      // Fix: kosongkan string tanggal jadi null supaya tidak error "invalid input syntax for type date"
      const cleanForm = {
        ...form,
        birth_date:    form.birth_date    || null,
        end_date:      form.end_date      || null,
        join_date:     form.join_date     || null,
      }

      if(editId){
        // Cek apakah status berubah jadi resigned
        const prevEmp = employees.find(e=>e.id===editId)
        const wasActive = prevEmp?.status === 'active'
        const nowResigned = cleanForm.status === 'resigned'

        const res=await fetch('/api/employees',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editId,...cleanForm})})
        const data=await res.json()
        if(!res.ok)throw new Error(data.error)
        setEmployees(prev=>prev.map(e=>e.id===editId?data.data:e))
        flash('✓ Data karyawan berhasil diperbarui')

        // Auto-create offboarding jika status berubah ke resign
        if(wasActive && nowResigned){
          const today = new Date().toISOString().slice(0,10)
          await fetch('/api/offboarding',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
            employee_id: editId,
            offboard_type: 'Resign',
            report_date: today,
            effective_date: cleanForm.end_date || today,
            quarter: `Q${Math.ceil((new Date().getMonth()+1)/3)}`,
            year: new Date().getFullYear(),
            return_assets: false, clearance_letter: false,
            exit_interview: false, send_paklaring: false,
            bpjs_deactivated: false, final_payment_done: false,
          })})
          flash('✓ Status diperbarui & data offboarding otomatis ditambahkan ke Turnover')
        }
      }else{
        const res=await fetch('/api/employees',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(cleanForm)})
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
    if(res.ok){setEmployees(prev=>prev.filter(e=>e.id!==id));bulk.clear([id]);flash('✓ Karyawan berhasil dihapus')}
    else alert('Gagal menghapus')
  }

  async function bulkDeleteEmployees(){
    if(bulk.count===0) return
    if(!confirm(`Hapus ${bulk.count} karyawan yang dipilih? Tidak bisa dibatalkan.`)) return
    setBulkDeleting(true)
    const ids=[...bulk.checkedIds]
    await Promise.all(ids.map(id=>fetch(`/api/employees?id=${id}`,{method:'DELETE'})))
    setEmployees(prev=>prev.filter(e=>!ids.includes(e.id)))
    bulk.clear(); setBulkDeleting(false)
    flash(`✓ ${ids.length} karyawan berhasil dihapus`)
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
      const buf=await file.arrayBuffer();const wb=XLSX.read(buf, { cellDates: true })
      const rows:any[]=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: false, dateNF: 'yyyy-mm-dd' })

      // Normalize: pastikan semua value yang Date object diconvert ke string YYYY-MM-DD
      const normalizeRow = (row: any) => {
        const out: any = {}
        for(const key of Object.keys(row)){
          const val = row[key]
          if(val instanceof Date){
            out[key] = `${val.getFullYear()}-${String(val.getMonth()+1).padStart(2,'0')}-${String(val.getDate()).padStart(2,'0')}`
          } else {
            out[key] = val
          }
        }
        return out
      }
      const normalizedRows = rows.map(normalizeRow)

      flash(`${normalizedRows.length} baris ditemukan. Mengupload...`)
      const res=await fetch('/api/upload/employees',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rows:normalizedRows})})
      const data=await res.json()
      if(!res.ok)throw new Error(data.error)

      // Tampilkan detail jika ada yang di-skip
      if(data.errors?.length){
        const errMsg = data.errors.slice(0,3).join(' | ')
        flash(`✓ ${data.count} berhasil · ${data.skipped} gagal: ${errMsg}`)
        console.error('Import errors:', data.errors)
      } else {
        flash(`✓ ${data.count} dari ${normalizedRows.length} karyawan berhasil diimport!`)
      }

      // Fetch fresh — API GET sudah decrypt nama otomatis
      const fresh=await fetch('/api/employees', { cache: 'no-store' }).then(r=>r.json())
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
          <div className="card-head">
            <span className="card-title">By division</span>
            {fDiv && <button onClick={()=>setFDiv('')} className="text-[10.5px] text-teal-600 hover:underline">Reset</button>}
          </div>
          <div className="card-body space-y-1.5">
            {divCounts.slice(0,8).map(([div,count])=>{
              // count semua karyawan per divisi (aktif + non-aktif), sesuai tabel
              const totalDiv = employees.filter(e=>e.division===div).length
              const activeDiv = active.filter(e=>e.division===div).length
              const pct = Math.round((totalDiv/employees.length)*100)
              return(
                <button key={div} onClick={()=>setFDiv(fDiv===div?'':div)}
                  className={cn('w-full text-left group rounded-lg transition-all py-0.5',fDiv===div?'bg-teal-50':'hover:bg-slate-50')}>
                  <div className="flex items-center gap-3">
                    <div className={cn('text-[11px] w-24 flex-shrink-0 text-right truncate',fDiv===div?'text-teal-700 font-semibold':'text-slate-500')}>{div as string}</div>
                    <div className="flex-1 h-6 bg-slate-50 rounded-lg overflow-hidden">
                      <div className={cn('h-full rounded-lg flex items-center px-2.5',fDiv===div?'bg-teal-500':'bg-[#0f1e3d] group-hover:bg-teal-600')}
                        style={{width:`${Math.max(Math.round((totalDiv/((divCounts[0]?.[1] as number)||1))*100),4)}%`}}>
                        <span className="text-[10px] font-bold text-white">{totalDiv}</span>
                      </div>
                    </div>
                    {activeDiv < totalDiv && (
                      <span className="text-[9.5px] text-slate-400 flex-shrink-0">{activeDiv} aktif</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
          <div className="px-5 pb-3 text-[10px] text-slate-300">Klik untuk filter tabel</div>
        </div>

        <div className="col-span-3 space-y-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            {([
              { key: 'active',       label: 'Aktif',   count: employees.filter(e=>e.status==='active').length,        color: 'text-teal-700' },
              { key: 'resigned',     label: 'Resign',  count: employees.filter(e=>e.status==='resigned').length,      color: 'text-red-600' },
              { key: 'end_contract', label: 'End OC',  count: employees.filter(e=>e.status==='end_contract').length,  color: 'text-blue-600' },
            ] as const).map(tab=>(
              <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
                className={cn('flex items-center gap-2 px-4 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all',
                  activeTab===tab.key
                    ?'bg-white shadow-sm text-slate-800'
                    :'text-slate-500 hover:text-slate-700')}>
                {tab.label}
                <span className={cn('text-[11px] font-bold px-1.5 py-0.5 rounded-full',
                  activeTab===tab.key
                    ?tab.key==='active'?'bg-teal-50 text-teal-700':tab.key==='resigned'?'bg-red-50 text-red-600':'bg-blue-50 text-blue-600'
                    :'bg-slate-200 text-slate-500')}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Filters + Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white border border-slate-100 rounded-lg px-3 py-1.5 flex-1 min-w-[160px]">
              <Search size={12} className="text-slate-300"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama, ID, divisi..." className="bg-transparent text-[11.5px] outline-none w-full text-slate-800 placeholder:text-slate-300"/>
            </div>
            <select value={fEntity} onChange={e=>setFEntity(e.target.value)} className="form-input !w-auto py-1.5 text-[11px]">
              <option value="">Semua entitas</option>{entities.map(en=><option key={en}>{en}</option>)}
            </select>
            <select value={fDiv} onChange={e=>setFDiv(e.target.value)} className="form-input !w-auto py-1.5 text-[11px]">
              <option value="">Semua divisi</option>{divs.map(d=><option key={d}>{d}</option>)}
            </select>
            <div className="flex items-center gap-2">
              {msg&&<span className={cn('text-[10.5px] font-medium',msg.startsWith('✓')?'text-teal-600':msg.startsWith('✗')?'text-red-600':'text-amber-600')}>{msg}</span>}
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden"/>
              <TemplateBtn sheet="Workforce"/>
              <button onClick={()=>fileRef.current?.click()} disabled={importing} className="btn btn-ghost btn-sm"><Upload size={12}/> Import</button>
              <button onClick={handleExport} className="btn btn-ghost btn-sm"><Download size={12}/> Export</button>
              <button onClick={openAdd} className="btn btn-teal btn-sm"><Plus size={12}/> Tambah</button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-[10.5px] text-slate-400">
              Menampilkan <strong className="text-slate-800">{filtered.length}</strong> karyawan
              {activeTab==='active'?' aktif':activeTab==='resigned'?' resign':' end OC'}
              {(fEntity||fDiv)&&<span> · difilter</span>}
            </div>
            <BulkBar count={bulk.count} onDelete={bulkDeleteEmployees} deleting={bulkDeleting} label="karyawan"/>
          </div>
          <div className="card overflow-x-auto">
            <table className="tbl" style={{minWidth:880}}>
              <thead><tr>
                <th className="w-8">
                  <input type="checkbox" className="w-3.5 h-3.5 rounded accent-teal-500 cursor-pointer"
                    checked={bulk.isAllChecked(filtered.map(e=>e.id))}
                    onChange={()=>bulk.toggleAll(filtered.map(e=>e.id))}/>
                </th>
                <th className="text-center w-16">Aksi</th>
                {([{col:'full_name',label:'Karyawan'},{col:'division',label:'Divisi'},{col:'employee_id',label:'ID'}] as const).map(({col,label})=>(
                  <th key={col} className="cursor-pointer select-none hover:text-teal-600" onClick={()=>toggleSort(col)}>
                    <span className="flex items-center gap-1">{label}<span className="text-[10px] text-slate-300">{sortCol===col?(sortDir==='asc'?'↑':'↓'):'↕'}</span></span>
                  </th>
                ))}
                <th>Posisi</th><th>Entitas</th><th>Kontrak</th><th>Status</th>
                {([{col:'join_date',label:'Join date'},{col:'yos',label:'Masa kerja'}] as const).map(({col,label})=>(
                  <th key={col} className="cursor-pointer select-none hover:text-teal-600" onClick={()=>toggleSort(col)}>
                    <span className="flex items-center gap-1">{label}<span className="text-[10px] text-slate-300">{sortCol===col?(sortDir==='asc'?'↑':'↓'):'↕'}</span></span>
                  </th>
                ))}
                <th>Tgl Lahir</th>
                <th className="cursor-pointer select-none hover:text-teal-600" onClick={()=>toggleSort('end_date')}>
                  <span className="flex items-center gap-1">End Kontrak<span className="text-[10px] text-slate-300">{sortCol==='end_date'?(sortDir==='asc'?'↑':'↓'):'↕'}</span></span>
                </th>
              </tr></thead>
              <tbody>
                {filtered.map(e=>(
                  <tr key={e.id} className={bulk.isChecked(e.id)?'bg-blue-50/50':''}>
                    <td className="text-center">
                      <input type="checkbox" className="w-3.5 h-3.5 rounded accent-teal-500 cursor-pointer"
                        checked={bulk.isChecked(e.id)} onChange={()=>bulk.toggle(e.id)}/>
                    </td>
                    {/* Aksi di kiri — mudah dijangkau */}
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={()=>openEdit(e)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400 transition-colors" title="Edit"><Pencil size={12}/></button>
                        <button onClick={()=>deleteEmployee(e.id,e.full_name)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-400 transition-colors" title="Hapus"><Trash2 size={12}/></button>
                      </div>
                    </td>
                    <td><div className="flex items-center gap-2"><Avatar name={e.full_name} size="sm"/><div><div className="font-bold text-[12px]">{e.full_name}</div><div className="text-[10px] text-slate-300">{e.employee_id}</div></div></div></td>
                    <td className="text-[11px]">{e.division}</td>
                    <td className="text-[11px] text-slate-400">{e.employee_id}</td>
                    <td className="text-[11px] text-slate-600">{e.position}</td>
                    <td><Badge variant="navy">{e.entity}</Badge></td>
                    <td><Badge variant={e.employment_type==='PKWTT'?'teal':'blue'}>{e.employment_type}</Badge></td>
                    <td><StatusBadge status={e.status}/></td>
                    <td className="text-[11px] text-slate-400">{fmtDate(e.join_date)}</td>
                    <td className="text-[11px]">{calcYoS(e.join_date)}</td>
                    <td className="text-[11px] text-slate-400">
                      {e.birth_date ? (()=>{
                        const b = new Date(e.birth_date+'T00:00:00')
                        const today = new Date()
                        const isToday = b.getMonth()===today.getMonth()&&b.getDate()===today.getDate()
                        const nextBirthday = new Date(today.getFullYear(), b.getMonth(), b.getDate())
                        if(nextBirthday < today) nextBirthday.setFullYear(today.getFullYear()+1)
                        const daysLeft = Math.round((nextBirthday.getTime()-today.getTime())/86400000)
                        return(
                          <div className="flex items-center gap-1.5">
                            <span>{b.getDate()}/{b.getMonth()+1}/{b.getFullYear()}</span>
                            {isToday && <span title="Ulang tahun hari ini!">🎂</span>}
                            {!isToday && daysLeft<=30 && (
                              <span className="text-[10px] text-amber-500 font-semibold">{daysLeft}hr lagi</span>
                            )}
                          </div>
                        )
                      })() : <span className="text-slate-300">–</span>}
                    </td>
                    <td className={cn('text-[11px]',e.end_date&&new Date(e.end_date)<new Date(Date.now()+60*86400000)?'text-red-600 font-bold':'text-slate-400')}>
                      {e.end_date ? (()=>{
                        const d = Math.round((new Date(e.end_date).getTime()-Date.now())/86400000)
                        const fmt = fmtDate(e.end_date)
                        if(d<0) return <div><div className="text-slate-400">{fmt}</div><div className="text-[10px] text-slate-300">Sudah lewat</div></div>
                        if(d===0) return <div><div className="text-red-600 font-bold">{fmt}</div><div className="text-[10px] text-red-500 font-bold">Hari ini!</div></div>
                        if(d<=7)  return <div><div className="text-red-600 font-bold">{fmt}</div><div className="text-[10px] text-red-500 font-semibold">{d} hari lagi</div></div>
                        if(d<=30) return <div><div className="text-orange-600 font-bold">{fmt}</div><div className="text-[10px] text-orange-500 font-semibold">{d} hari lagi</div></div>
                        if(d<=60) return <div><div className="text-amber-600 font-semibold">{fmt}</div><div className="text-[10px] text-amber-500">{d} hari lagi</div></div>
                        return <div className="text-slate-400">{fmt}</div>
                      })() : <span className="text-slate-300">–</span>}
                    </td>
                  </tr>
                ))}
                {filtered.length===0&&<EmptyState message="Tidak ada data yang sesuai filter"/>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dynamic insights */}
      {(()=>{
        const active = employees.filter(e=>e.status==='active')
        // Divisi terbesar
        const byDiv: Record<string,number> = {}
        active.forEach(e=>{ byDiv[e.division]=(byDiv[e.division]||0)+1 })
        const topDiv = Object.entries(byDiv).sort((a,b)=>b[1]-a[1])[0]
        // Gender split
        const female = active.filter(e=>e.gender==='Perempuan').length
        const femalePct = active.length>0?Math.round(female/active.length*100):0
        const majorGender = femalePct>=50?`${femalePct}% Perempuan`:`${100-femalePct}% Laki-laki`
        // Kontrak mau habis
        const expiring = active.filter(e=>{ if(!e.end_date) return false; const d=Math.round((new Date(e.end_date).getTime()-Date.now())/86400000); return d>=0&&d<=60 })
        // PKWT ratio
        const pkwt = active.filter(e=>e.employment_type==='PKWT').length
        const pkwtPct = active.length>0?Math.round(pkwt/active.length*100):0

        const insights = []

        if(topDiv) insights.push({
          title: `${topDiv[0]}: divisi terbesar (${topDiv[1]} orang)`,
          text: `${Math.round(topDiv[1]/active.length*100)}% dari total headcount ada di ${topDiv[0]}. Perlu monitoring beban kerja dan distribusi tugas secara berkala.`,
          color: 'bg-[#0f1e3d]', titleColor: 'text-teal-300'
        })

        if(expiring.length>0) insights.push({
          title: `${expiring.length} kontrak habis dalam 60 hari`,
          text: `${expiring.map(e=>e.full_name?.split(' ')[0]).join(', ')} perlu keputusan perpanjangan segera sebelum jatuh tempo.`,
          color: 'bg-red-900/70', titleColor: 'text-red-300'
        })
        else insights.push({
          title: 'Semua kontrak aman',
          text: `Tidak ada kontrak yang habis dalam 60 hari ke depan. Total ${active.length} karyawan aktif.`,
          color: 'bg-teal-800/60', titleColor: 'text-teal-200'
        })

        if(pkwtPct>40) insights.push({
          title: `${pkwtPct}% karyawan berstatus PKWT`,
          text: `Rasio kontrak cukup tinggi. Pertimbangkan konversi ke PKWTT untuk posisi-posisi yang bersifat permanen.`,
          color: 'bg-amber-900/60', titleColor: 'text-amber-300'
        })

        insights.push({
          title: `Gender split: ${majorGender}`,
          text: `Dari ${active.length} karyawan aktif, ${female} perempuan dan ${active.length-female} laki-laki.`,
          color: 'bg-[#1a2d5a]', titleColor: 'text-teal-200'
        })

        return(
          <div className="grid grid-cols-2 gap-3">
            {insights.slice(0,2).map((ins,i)=>(
              <div key={i}><InsightCard title={String(ins.title)} text={String(ins.text)} color={ins.color as string} titleColor={ins.titleColor as string}/></div>
            ))}
          </div>
        )
      })()}

      {showModal&&(
        <Modal title={editId?'Edit data karyawan':'Tambah karyawan baru'} onClose={()=>setShowModal(false)} size="lg">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Employee ID *</label><input value={form.employee_id} onChange={e=>fv('employee_id',e.target.value)} className="form-input" placeholder="EMP021" disabled={!!editId}/></div>
              <div><label className="form-label">Nama lengkap *</label><input value={form.full_name} onChange={e=>fv('full_name',e.target.value)} className="form-input" placeholder="Nama karyawan"/></div>
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" value={form.email} onChange={e=>fv('email',e.target.value)} className="form-input" placeholder="email@co.id"/>
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
