'use client'
import { useState, useRef } from 'react'
import { Plus, ChevronRight, Search, Download, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Badge, InsightCard, EmptyState, ProgressBar, Avatar } from '@/components/ui'
import { fmtDate, cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import * as XLSX from 'xlsx'

export default function LearningClient({ tna: init, employees }: { tna: any[]; employees: any[] }) {
  const router = useRouter()
  const [tna, setTna] = useState(init)
  const [search, setSearch] = useState('')
  const [filterYear, setFilterYear] = useState(2026)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState<any>({ employee_id:'', training_name:'', training_category:'Hard Skill', training_method:'Online', quarter:'Q2', year:2026, target_date:'', status:'Planned' })
  const fileRef = useRef<HTMLInputElement>(null)
  const fv = (k:string,v:any) => setForm((p:any)=>({...p,[k]:v}))
  const flash = (t:string)=>{ setMsg(t); setTimeout(()=>setMsg(''),4000) }

  // Filter by tahun
  const tnaYear = tna.filter(t => !t.year || t.year === filterYear)
  const done    = tnaYear.filter(t=>t.status==='Done')
  const overdue = tnaYear.filter(t=>t.status==='Overdue')

  // Per-employee summary — filtered by year
  const empSummary = employees.map(e=>{
    const et=tnaYear.filter(t=>t.employee_id===e.id)
    const ed=et.filter(t=>t.status==='Done').length
    const pct=et.length>0?Math.round(ed/et.length*100):0
    const hasOverdue=et.some(t=>t.status==='Overdue')
    const inProgress=et.some(t=>t.status==='In Progress')
    const avgScore=ed>0&&et.filter(t=>t.score).length>0?Math.round(et.filter(t=>t.score).reduce((s,t)=>s+t.score,0)/et.filter(t=>t.score).length):null
    return {...e, total:et.length, done:ed, pct, hasOverdue, inProgress, avgScore}
  })

  const withTraining = empSummary.filter(e=>e.total>0)
    .filter(e=>!search||e.full_name.toLowerCase().includes(search.toLowerCase())||e.division.toLowerCase().includes(search.toLowerCase()))
  const withoutTraining = empSummary.filter(e=>e.total===0)
    .filter(e=>!search||e.full_name.toLowerCase().includes(search.toLowerCase())||e.division.toLowerCase().includes(search.toLowerCase()))

  // Group by division
  const divGroups = Object.entries(
    withTraining.reduce((acc:any, e)=>{
      if(!acc[e.division])acc[e.division]=[]
      acc[e.division].push(e)
      return acc
    },{})
  ).sort((a,b)=>a[0].localeCompare(b[0])) as [string, any[]][]

  async function saveQuick(){
    if(!form.employee_id||!form.training_name){alert('Karyawan dan nama training wajib diisi');return}
    setSaving(true)
    try{
      const payload = {...form, year: filterYear}
      const res=await fetch('/api/tna',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      const data=await res.json();if(!res.ok)throw new Error(data.error)
      const emp=employees.find(e=>e.id===form.employee_id)
      setTna(prev=>[{...data.data,employee:emp},...prev])
      setShowModal(false); flash('✓ Training berhasil ditambahkan')
    }catch(err:any){alert('Error: '+err.message)}
    setSaving(false)
  }

  function exportXls(){
    const rows=tnaYear.map(t=>{
      const emp=employees.find(e=>e.id===t.employee_id)
      return {'Nama':emp?.full_name||t.employee_id,'Divisi':emp?.division||'','Training':t.training_name,'Kategori':t.training_category||'','Metode':t.training_method||'','Quarter':t.quarter||'','Tahun':t.year||'','Target Date':t.target_date||'','Status':t.status,'Score':t.score||'','Vendor':t.vendor||'','Durasi (jam)':t.duration_hours||'','Catatan':t.notes||''}
    })
    const ws=XLSX.utils.json_to_sheet(rows);const wb=XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb,ws,'TNA');XLSX.writeFile(wb,`tna-5758-${new Date().toISOString().slice(0,10)}.xlsx`)
    flash('✓ Export berhasil')
  }

  async function importXls(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];if(!file)return
    flash('Membaca file...')
    try{
      const buf=await file.arrayBuffer();const wb=XLSX.read(buf)
      const rows:any[]=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
      let count=0
      for(const row of rows){
        const empName=row['Nama']||''
        const emp=employees.find(e=>e.full_name.toLowerCase()===empName.toLowerCase())
        if(!emp||!row['Training'])continue
        const payload={employee_id:emp.id,training_name:row['Training'],training_category:row['Kategori']||'Hard Skill',training_method:row['Metode']||'Online',quarter:row['Quarter']||'Q2',year:parseInt(row['Tahun'])||2026,target_date:row['Target Date']||'',status:row['Status']||'Planned',score:row['Score']?parseInt(row['Score']):null,vendor:row['Vendor']||'',duration_hours:row['Durasi (jam)']?parseInt(row['Durasi (jam)']):null,notes:row['Catatan']||''}
        const res=await fetch('/api/tna',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
        const data=await res.json()
        if(res.ok&&data.data){setTna(prev=>[{...data.data,employee:emp},...prev]);count++}
      }
      flash(`✓ ${count} training berhasil diimport`)
    }catch(err:any){flash(`✗ Error: ${err.message}`)}
    if(fileRef.current)fileRef.current.value=''
  }

  return(
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3">
        <div className="card p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-lg">78%</div><div><div className="text-[11px] text-slate-400">Participation rate</div><div className="text-[13px] font-semibold">vs 65% Q1</div></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">{tnaYear.length>0?`${Math.round(done.length/tnaYear.length*100)}%`:'0%'}</div><div><div className="text-[11px] text-slate-400">Completion rate</div><div className="text-[13px] font-semibold">target 80%</div></div></div>
        <div className="card p-4 flex items-center gap-3"><div className={cn('w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg',overdue.length>0?'bg-red-50 text-red-500':'bg-teal-50 text-teal-600')}>{overdue.length}</div><div><div className="text-[11px] text-slate-400">TNA overdue</div><div className="text-[13px] font-semibold">{overdue.length>0?'perlu action':'aman'}</div></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-lg">{done.reduce((s,t)=>s+(t.duration_hours??8),0)}</div><div><div className="text-[11px] text-slate-400">Total jam training</div><div className="text-[13px] font-semibold">YTD {filterYear}</div></div></div>
      </div>

      {/* Header + actions */}
      <div className="flex items-center gap-3">
        <h2 className="text-[14px] font-semibold text-slate-800">Training per Karyawan</h2>
        {/* Year filter */}
        <div className="flex gap-2 ml-2">
          {[2026,2025,2024].map(y=>(
            <button key={y} onClick={()=>setFilterYear(y)}
              className={cn('px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all',
                filterYear===y?'bg-[#0f1e3d] text-white border-[#0f1e3d]':'bg-white text-slate-500 border-slate-200 hover:border-slate-400')}>
              {y}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 w-48">
          <Search size={12} className="text-slate-300"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nama atau divisi..."
            className="bg-transparent text-[12px] outline-none w-full text-slate-700 placeholder:text-slate-300"/>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {msg&&<span className={cn('text-[11px] font-medium',msg.startsWith('✓')?'text-teal-600':'text-red-600')}>{msg}</span>}
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={importXls} className="hidden"/>
          <button onClick={()=>fileRef.current?.click()} className="btn btn-ghost btn-sm"><Upload size={12}/> Import</button>
          <button onClick={exportXls} className="btn btn-ghost btn-sm"><Download size={12}/> Export</button>
          <button onClick={()=>setShowModal(true)} className="btn btn-teal btn-sm"><Plus size={12}/> Quick add</button>
        </div>
      </div>

      {/* Per-division groups */}
      {divGroups.map(([division, emps])=>(
        <div key={division}>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-slate-100"/>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3">{division}</span>
            <div className="h-px flex-1 bg-slate-100"/>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {emps.map(e=>(
              <button key={e.id} onClick={()=>router.push(`/learning/person/${e.id}`)}
                className="card p-4 text-left hover:shadow-md hover:border-teal-300 transition-all group cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={e.full_name} size="sm"/>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-semibold text-slate-800 truncate">{e.full_name}</div>
                    <div className="text-[10.5px] text-slate-400">{e.position||e.division}</div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-teal-500 flex-shrink-0"/>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10.5px] text-slate-400">{e.done}/{e.total} selesai</span>
                    <span className={cn('text-[11px] font-bold',e.hasOverdue?'text-red-500':e.pct===100?'text-teal-600':e.pct>=50?'text-blue-600':'text-amber-500')}>{e.pct}%</span>
                  </div>
                  <ProgressBar value={e.pct} color={e.hasOverdue?'bg-red-400':e.pct===100?'bg-teal-500':e.pct>=50?'bg-blue-400':'bg-amber-400'}/>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {e.hasOverdue&&<Badge variant="red">Overdue</Badge>}
                  {e.inProgress&&<Badge variant="blue">In Progress</Badge>}
                  {e.avgScore&&<Badge variant="teal">Avg {e.avgScore}/100</Badge>}
                  {!e.hasOverdue&&!e.inProgress&&e.pct===100&&<Badge variant="teal">✓ Selesai</Badge>}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Tanpa training */}
      {withoutTraining.length>0&&(
        <div className="card">
          <div className="card-head"><span className="card-title">Belum ada training</span><Badge variant="gray">{withoutTraining.length} karyawan</Badge></div>
          <div className="flex flex-wrap gap-2 p-4">
            {withoutTraining.map(e=>(
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

      {withTraining.length===0&&withoutTraining.length===0&&(
        <div className="card p-8 text-center text-slate-400 text-[12px]">Tidak ada karyawan yang sesuai pencarian</div>
      )}

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
              💡 Untuk detail lengkap (link file, score, vendor), klik nama karyawan setelah disimpan.
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={()=>setShowModal(false)} className="btn btn-ghost">Batal</button>
              <button onClick={saveQuick} disabled={saving} className="btn btn-teal">{saving?'Menyimpan...':'Simpan'}</button>
            </div>
          </div>
        </Modal>
      )}

      <div className="grid grid-cols-2 gap-3">
        <InsightCard title="Completion rate 61% — di bawah target 80%" text="Perlu akselerasi eksekusi training di Q2–Q3. Klik nama karyawan untuk update progress detail."/>
        <InsightCard title="Klik nama untuk lihat & edit training" text="Setiap karyawan punya halaman training tersendiri — lengkap dengan link file, progress, score, dan riwayat training." color="bg-[#1a2d5a]" titleColor="text-teal-200"/>
      </div>
    </div>
  )
}
