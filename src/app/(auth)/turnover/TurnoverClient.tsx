'use client'
import { useState, useRef } from 'react'
import BulkBar from '@/components/ui/BulkBar'
import { useBulkSelect } from '@/lib/useBulkSelect'
import { Plus, Pencil, Trash2, Download, Upload } from 'lucide-react'
import { KPICard, Badge, InlineBar, InsightCard, EmptyState } from '@/components/ui'
import { fmtDate, calcYoS, cn } from '@/lib/utils'
import * as XLSX from 'xlsx'
import Modal from '@/components/ui/Modal'

const EMPTY = { employee_id:'', pic_name:'', report_date:'', quarter:'Q2', year:2026,
  offboard_type:'Resign', effective_date:'', reason_to_leave:'',
  return_assets:false, clearance_letter:false, exit_interview:false,
  send_paklaring:false, bpjs_deactivated:false, final_payment_done:false, notes:'' }

export default function TurnoverClient({ offboarding: initOff, employees, active }: { offboarding:any[]; employees:any[]; active:any[] }) {
  const [offboarding, setOff] = useState(initOff)
  const bulk = useBulkSelect()
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [filterYear, setFilterYear] = useState<number|null>(null) // null = semua tahun
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)
  const fv = (k:string,v:any) => setForm((p:any)=>({...p,[k]:v}))

  // Filter by tahun
  const offFiltered = filterYear ? offboarding.filter(o => o.year === filterYear || new Date(o.effective_date||o.report_date||'').getFullYear() === filterYear) : offboarding

  const total = offFiltered.length
  const turnoverRate = active.length>0 ? ((total/(active.length+total))*100).toFixed(1) : '0'

  const byDiv: Record<string,number> = {}
  offFiltered.forEach(o=>{ const d=o.employee?.division??'Unknown'; byDiv[d]=(byDiv[d]||0)+1 })
  const divData = Object.entries(byDiv).sort((a,b)=>(b[1] as number)-(a[1] as number))
  const maxDiv = (divData[0]?.[1] as number)||1

  function openAdd() { setForm({...EMPTY}); setEditId(null); setShowModal(true) }
  function openEdit(o:any) {
    setForm({ employee_id:o.employee_id, pic_name:o.pic_name||'', report_date:o.report_date||'',
      quarter:o.quarter||'Q2', year:o.year||2026, offboard_type:o.offboard_type||'Resign',
      effective_date:o.effective_date||'', reason_to_leave:o.reason_to_leave||'',
      return_assets:o.return_assets||false, clearance_letter:o.clearance_letter||false,
      exit_interview:o.exit_interview||false, send_paklaring:o.send_paklaring||false,
      bpjs_deactivated:o.bpjs_deactivated||false, final_payment_done:o.final_payment_done||false, notes:o.notes||'' })
    setEditId(o.id); setShowModal(true)
  }

  async function save() {
    if (!form.employee_id||!form.effective_date) { alert('Karyawan dan tanggal efektif wajib diisi'); return }
    setSaving(true)
    try {
      if (editId) {
        const res = await fetch('/api/offboarding',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editId,...form})})
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        const emp = employees.find(e=>e.id===form.employee_id)
        setOff(prev=>prev.map(o=>o.id===editId?{...data.data,employee:emp}:o))
      } else {
        const res = await fetch('/api/offboarding',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        const emp = employees.find(e=>e.id===form.employee_id)
        setOff(prev=>[{...data.data,employee:emp},...prev])
      }
      setShowModal(false)
    } catch(err:any){alert('Error: '+err.message)}
    setSaving(false)
  }

  async function del(id:string) {
    if (!confirm('Hapus data offboarding ini?')) return
    await fetch(`/api/offboarding?id=${id}`,{method:'DELETE'})
    setOff(prev=>prev.filter(o=>o.id!==id))
  }

  async function bulkDel(){
    if(bulk.count===0) return
    if(!confirm(`Hapus ${bulk.count} data yang dipilih?`)) return
    setBulkDeleting(true)
    const ids=[...bulk.checkedIds]
    await Promise.all(ids.map(id=>fetch(`/api/offboarding?id=${id}`,{method:'DELETE'})))
    setOff(prev=>(prev as any[]).filter((x:any)=>!ids.includes(x.id)))
    bulk.clear(); setBulkDeleting(false)
  }

  async function toggleCheck(o:any, field:string) {
    const val = !o[field]
    const res = await fetch('/api/offboarding',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:o.id,[field]:val})})
    if (res.ok) setOff(prev=>prev.map(x=>x.id===o.id?{...x,[field]:val}:x))
  }

  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const flash = (t:string)=>{setMsg(t);setTimeout(()=>setMsg(''),4000)}

  function exportXls(){
    const rows=offboarding.map(o=>({'Nama':o.employee?.full_name||'','Divisi':o.employee?.division||'','Tipe':o.offboard_type,'Alasan':o.reason_to_leave||'','Tgl Efektif':o.effective_date||'','Quarter':o.quarter||'','PIC':o.pic_name||'','Return Assets':o.return_assets?'Ya':'Tidak','Clearance':o.clearance_letter?'Ya':'Tidak','Exit Interview':o.exit_interview?'Ya':'Tidak','Paklaring':o.send_paklaring?'Ya':'Tidak','BPJS':o.bpjs_deactivated?'Ya':'Tidak','Final Pay':o.final_payment_done?'Ya':'Tidak'}))
    const ws=XLSX.utils.json_to_sheet(rows);const wb=XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb,ws,'Turnover');XLSX.writeFile(wb,`turnover-5758-${new Date().toISOString().slice(0,10)}.xlsx`)
    flash('✓ Export berhasil')
  }

  const CHECKS = ['return_assets','clearance_letter','exit_interview','send_paklaring','bpjs_deactivated','final_payment_done']
  const CHECKS_LABEL: Record<string,string> = { return_assets:'Aset', clearance_letter:'Clearance', exit_interview:'Exit Int.', send_paklaring:'Paklaring', bpjs_deactivated:'BPJS', final_payment_done:'Final Pay' }

  return (
    <div className="space-y-5">
      {/* Year filter */}
      <div className="flex items-center gap-2">
        <button onClick={()=>setFilterYear(null)}
          className={cn('px-3.5 py-1.5 rounded-lg text-[12px] font-semibold border transition-all',
            !filterYear?'bg-[#0f1e3d] text-white border-[#0f1e3d]':'bg-white text-slate-500 border-slate-200 hover:border-slate-400')}>
          Semua Tahun
        </button>
        {[2026,2025,2024].map(y=>(
          <button key={y} onClick={()=>setFilterYear(y)}
            className={cn('px-3.5 py-1.5 rounded-lg text-[12px] font-semibold border transition-all',
              filterYear===y?'bg-[#0f1e3d] text-white border-[#0f1e3d]':'bg-white text-slate-500 border-slate-200 hover:border-slate-400')}>
            {y}
          </button>
        ))}
        <span className="text-[11.5px] text-slate-400 ml-2">
          {filterYear ? `Menampilkan data ${filterYear} (${offFiltered.length} record)` : `Semua tahun (${offboarding.length} record)`}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <KPICard label="Turnover rate"   value={`${turnoverRate}%`} change="target <5%"  changeType="down" accent="bg-red-400"/>
        <KPICard label="Total resign"    value={offFiltered.filter(o=>o.offboard_type==='Resign').length} change={filterYear?`${filterYear}`:'YTD'} changeType="flat" accent="bg-amber-400"/>
        <KPICard label="End of contract" value={offFiltered.filter(o=>o.offboard_type==='End of Contract').length} change={filterYear?`${filterYear}`:'YTD'} changeType="flat" accent="bg-blue-400"/>
        <KPICard label="Retention rate"  value={`${(100-parseFloat(turnoverRate)).toFixed(1)}%`} change="vs 91.4% Q4" changeType="up" accent="bg-teal-400"/>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="card-head"><span className="card-title">Turnover by division</span></div>
          <div className="card-body space-y-2">
            {divData.map(([div,count])=>{
              const divActive=active.filter(e=>e.division===div).length
              const rate=divActive>0?Math.round(count/(count+divActive)*100):0
              const col=rate>=12?'bg-red-500':rate>=8?'bg-amber-500':'bg-teal-500'
              return <InlineBar key={div} label={div} value={`${rate}%`} pct={Math.round(count/maxDiv*100)} color={col}/>
            })}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><span className="card-title">Turnover by tenure</span></div>
          <div className="card-body space-y-4">
            {[{label:'0 – 6 bulan',pct:60,color:'bg-red-500',note:'Early attrition — paling concern'},{label:'6 – 12 bulan',pct:20,color:'bg-amber-500',note:''},{label:'> 1 tahun',pct:20,color:'bg-teal-500',note:''}].map(t=>(
              <div key={t.label}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-[12px] font-semibold">{t.label}</span>
                  <span className="text-[12px] font-extrabold text-slate-600">{t.pct}%</span>
                </div>
                <div className="prog-bar h-2"><div className={cn('prog-fill',t.color)} style={{width:`${t.pct}%`}}/></div>
                {t.note&&<div className="text-[10px] text-slate-300 mt-1">{t.note}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <div className="card-head">
          <span className="card-title">Detail karyawan keluar</span>
          <div className="flex items-center gap-2">
            <Badge variant="red">{total} total</Badge>
            <button onClick={exportXls} className="btn btn-ghost btn-sm"><Download size={12}/> Export</button>
            <BulkBar count={bulk.count} onDelete={bulkDel} deleting={bulkDeleting} label="data"/>
              <button onClick={openAdd} className="btn btn-teal btn-sm"><Plus size={12}/> Input keluar</button>
          </div>
        </div>
        <table className="tbl" style={{minWidth:900}}>
          <thead><tr>
            <th className="w-8"><input type="checkbox" className="w-3.5 h-3.5 rounded accent-teal-500 cursor-pointer" checked={bulk.isAllChecked(offFiltered.map(o=>o.id))} onChange={()=>bulk.toggleAll(offFiltered.map(o=>o.id))}/></th>
            <th>Nama</th><th>Divisi</th><th>Tipe</th><th>Alasan</th><th>Eff. date</th>
            {CHECKS.map(c=><th key={c} className="text-center text-[9px]">{CHECKS_LABEL[c]}</th>)}
            <th className="text-center">Aksi</th>
          </tr></thead>
          <tbody>
            {offFiltered.map(o=>(<tr key={o.id} className={bulk.isChecked(o.id)?"bg-blue-50/50":""}>
                <td className="text-center w-8"><input type="checkbox" className="w-3.5 h-3.5 rounded accent-teal-500 cursor-pointer" checked={bulk.isChecked(o.id)} onChange={()=>bulk.toggle(o.id)}/></td>
                <td className="font-bold">{o.employee?.full_name}</td>
                <td className="text-[11px] text-slate-400">{o.employee?.division}</td>
                <td><Badge variant={o.offboard_type==='Resign'?'red':'blue'}>{o.offboard_type==='End of Contract'?'End OC':o.offboard_type}</Badge></td>
                <td className="text-[11px] text-slate-400 max-w-[130px]"><span className="line-clamp-1">{o.reason_to_leave??'–'}</span></td>
                <td className="text-[11px] text-slate-400">{fmtDate(o.effective_date)}</td>
                {CHECKS.map(c=>(
                  <td key={c} className="text-center">
                    <button onClick={()=>toggleCheck(o,c)} className={cn('w-6 h-6 rounded-md text-[10px] font-bold inline-flex items-center justify-center border transition-colors', o[c]?'bg-teal-50 text-teal-600 border-teal-200':'bg-gray-50 text-gray-300 border-gray-200')}>
                      {o[c]?'✓':'–'}
                    </button>
                  </td>
                ))}
                <td><div className="flex items-center justify-center gap-1">
                  <button onClick={()=>openEdit(o)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400"><Pencil size={12}/></button>
                  <button onClick={()=>del(o.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-400"><Trash2 size={12}/></button>
                </div></td>
              </tr>
            ))}
            {offFiltered.length===0&&<EmptyState message="Belum ada data offboarding"/>}
          </tbody>
        </table>
      </div>

      {showModal&&(
        <Modal title={editId?'Edit data keluar':'Input karyawan keluar'} onClose={()=>setShowModal(false)} size="lg">
          <div className="space-y-3">
            <div><label className="form-label">Karyawan *</label>
              <select value={form.employee_id} onChange={e=>fv('employee_id',e.target.value)} className="form-input">
                <option value="">Pilih karyawan...</option>
                {employees.map(e=><option key={e.id} value={e.id}>{e.full_name} — {e.division}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Tipe keluar</label>
                <select value={form.offboard_type} onChange={e=>fv('offboard_type',e.target.value)} className="form-input">
                  <option>Resign</option><option>End of Contract</option><option>Termination</option><option>Retirement</option>
                </select>
              </div>
              <div><label className="form-label">Quarter</label>
                <select value={form.quarter} onChange={e=>fv('quarter',e.target.value)} className="form-input">
                  <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Tgl lapor</label><input type="date" value={form.report_date} onChange={e=>fv('report_date',e.target.value)} className="form-input"/></div>
              <div><label className="form-label">Tgl efektif *</label><input type="date" value={form.effective_date} onChange={e=>fv('effective_date',e.target.value)} className="form-input"/></div>
            </div>
            <div><label className="form-label">Alasan keluar</label><textarea value={form.reason_to_leave} onChange={e=>fv('reason_to_leave',e.target.value)} className="form-input h-16 resize-none" placeholder="Alasan resign / keluar..."/></div>
            <div><label className="form-label">PIC HR</label><input value={form.pic_name} onChange={e=>fv('pic_name',e.target.value)} className="form-input" placeholder="Nama HR yang handle"/></div>
            <div>
              <label className="form-label">Checklist offboarding</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {CHECKS.map(c=>(
                  <label key={c} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form[c]} onChange={e=>fv(c,e.target.checked)} className="rounded"/>
                    <span className="text-[11px]">{CHECKS_LABEL[c]}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={()=>setShowModal(false)} className="btn btn-ghost">Batal</button>
              <button onClick={save} disabled={saving} className="btn btn-teal">{saving?'Menyimpan...':editId?'Update':'Simpan'}</button>
            </div>
          </div>
        </Modal>
      )}

      {(()=>{
        const total = offFiltered.length
        if(total===0) return(
          <div className="grid grid-cols-2 gap-3">
            <InsightCard title="Tidak ada turnover di periode ini" text="Tidak ada data karyawan keluar. Retention rate terjaga dengan baik." color="bg-teal-800/60" titleColor="text-teal-200"/>
          </div>
        )

        // Early attrition: tenure < 6 bulan
        const earlyOut = offFiltered.filter(o=>{ if(!o.employee?.join_date||!o.effective_date) return false; const months=(new Date(o.effective_date).getTime()-new Date(o.employee.join_date).getTime())/(1000*60*60*24*30); return months<6 })
        const earlyPct = total>0?Math.round(earlyOut.length/total*100):0

        // Divisi turnover terbanyak
        const byDiv: Record<string,number> = {}
        offFiltered.forEach(o=>{ const d=o.employee?.division||'Unknown'; byDiv[d]=(byDiv[d]||0)+1 })
        const topDiv = Object.entries(byDiv).sort((a,b)=>b[1]-a[1])[0]

        // Resign vs end of contract
        const resignCount = offFiltered.filter(o=>o.offboard_type==='Resign').length
        const eocCount    = offFiltered.filter(o=>o.offboard_type==='End of Contract').length

        const insights = []

        if(earlyPct>=50) insights.push({
          title: `Early attrition ${earlyPct}% — perlu perhatian`,
          text: `${earlyOut.length} dari ${total} yang keluar punya tenure di bawah 6 bulan. Pertimbangkan structured onboarding dan 30-60-90 day check-in.`,
          color: 'bg-red-900/80', titleColor: 'text-red-300'
        })
        else if(earlyPct>0) insights.push({
          title: `Early attrition ${earlyPct}%`,
          text: `${earlyOut.length} dari ${total} yang keluar punya tenure di bawah 6 bulan. Masih dalam batas wajar.`,
          color: 'bg-amber-900/60', titleColor: 'text-amber-300'
        })
        else insights.push({
          title: 'Tidak ada early attrition',
          text: `Semua yang keluar sudah memiliki tenure lebih dari 6 bulan. Tanda onboarding dan adaptasi berjalan baik.`,
          color: 'bg-teal-800/60', titleColor: 'text-teal-200'
        })

        if(topDiv) insights.push({
          title: `${topDiv[0]}: turnover terbanyak (${topDiv[1]} orang)`,
          text: resignCount>eocCount
            ? `${resignCount} resign dari total ${total} keluar. Pertimbangkan exit interview untuk mencari pola.`
            : `${eocCount} end of contract dari total ${total} keluar. Evaluasi perpanjangan kontrak untuk posisi strategis.`,
          color: topDiv[1]>=2?'bg-purple-900/70':'bg-[#1a2d5a]',
          titleColor: topDiv[1]>=2?'text-purple-300':'text-teal-200'
        })

        return(
          <div className="grid grid-cols-2 gap-3">
            {insights.map((ins,i)=>(
              <div key={i}><InsightCard title={String(ins.title)} text={String(ins.text)} color={ins.color as string} titleColor={ins.titleColor as string}/></div>
            ))}
          </div>
        )
      })()}
    </div>
  )
}
