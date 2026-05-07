'use client'
import { useState, useRef } from 'react'
import { Plus, Pencil, Trash2, Download } from 'lucide-react'
import { Badge, InlineBar, InsightCard, EmptyState } from '@/components/ui'
import { fmtCurrencyShort, cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import * as XLSX from 'xlsx'

const MONTHS_ID = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const EMPTY = { employee_id:'', year:2026, month:5, basic_salary:0, allowance:0, overtime:0, bonus:0, deduction:0, bpjs_ketenagakerjaan:0, bpjs_kesehatan:0, pph21:0, payment_date:'', notes:'' }

export default function PayrollClient({ salary: initSal, employees }: { salary: any[]; employees: any[] }) {
  const [salary, setSalary]           = useState(initSal)
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1)
  const [filterYear, setFilterYear]   = useState(2026)
  const [showModal, setShowModal]     = useState(false)
  const [editId, setEditId]           = useState<string|null>(null)
  const [saving, setSaving]           = useState(false)
  const [form, setForm]               = useState<any>(EMPTY)
  const [msg, setMsg]                 = useState('')
  const fv  = (k:string,v:any) => setForm((p:any)=>({...p,[k]:v}))
  const flash = (t:string) => { setMsg(t); setTimeout(()=>setMsg(''),4000) }

  const filtered  = salary.filter(s => s.year===filterYear && s.month===filterMonth)
  const totalNet  = filtered.reduce((s,r)=>s+(r.net_salary??0),0)
  const avgSalary = filtered.length>0 ? Math.round(totalNet/filtered.length) : 0

  // ── Yearly chart data ─────────────────────────────────────
  const yearlyData = MONTHS_ID.slice(1).map((m,i) => {
    const monthSal = salary.filter(s=>s.year===filterYear&&s.month===i+1)
    return { month: m.slice(0,3), total: monthSal.reduce((s,r)=>s+(r.net_salary??0),0), count: monthSal.length }
  })
  const maxTotal = Math.max(...yearlyData.map(d=>d.total), 1)

  const byDiv: Record<string,number> = {}
  filtered.forEach(r=>{ const d=r.employee?.division??'Unknown'; byDiv[d]=(byDiv[d]||0)+(r.net_salary??0) })
  const divData = Object.entries(byDiv).sort((a,b)=>b[1]-a[1])
  const maxDiv  = (divData[0]?.[1] as number)||1

  function openAdd(){ setForm({...EMPTY,month:filterMonth,year:filterYear}); setEditId(null); setShowModal(true) }
  function openEdit(s:any){
    setForm({ employee_id:s.employee_id, year:s.year, month:s.month,
      basic_salary:s.basic_salary||0, allowance:s.allowance||0, overtime:s.overtime||0,
      bonus:s.bonus||0, deduction:s.deduction||0, bpjs_ketenagakerjaan:s.bpjs_ketenagakerjaan||0,
      bpjs_kesehatan:s.bpjs_kesehatan||0, pph21:s.pph21||0,
      payment_date:s.payment_date||'', notes:s.notes||'' })
    setEditId(s.id); setShowModal(true)
  }

  async function save(){
    if(!form.employee_id){alert('Pilih karyawan');return}
    setSaving(true)
    try{
      const net = form.basic_salary+form.allowance+form.overtime+form.bonus-form.deduction-form.bpjs_ketenagakerjaan-form.bpjs_kesehatan-form.pph21
      const payload = {...form, net_salary: net}
      if(editId){
        const res=await fetch('/api/salary',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editId,...payload})})
        const data=await res.json();if(!res.ok)throw new Error(data.error)
        const emp=employees.find(e=>e.id===form.employee_id)
        setSalary(prev=>prev.map(s=>s.id===editId?{...data.data,employee:emp}:s))
        flash('✓ Data salary diperbarui')
      }else{
        const res=await fetch('/api/salary',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
        const data=await res.json();if(!res.ok)throw new Error(data.error)
        const emp=employees.find(e=>e.id===form.employee_id)
        setSalary(prev=>[{...data.data,employee:emp},...prev])
        flash('✓ Salary berhasil ditambahkan')
      }
      setShowModal(false)
    }catch(err:any){alert('Error: '+err.message)}
    setSaving(false)
  }

  async function del(id:string){
    if(!confirm('Hapus data salary ini?'))return
    await fetch(`/api/salary?id=${id}`,{method:'DELETE'})
    setSalary(prev=>prev.filter(s=>s.id!==id))
    flash('✓ Data dihapus')
  }

  function exportXls(){
    const rows=filtered.map(s=>({'Nama':s.employee?.full_name||'','Divisi':s.employee?.division||'','Bulan':MONTHS_ID[s.month],'Tahun':s.year,'Gaji Pokok':s.basic_salary,'Tunjangan':s.allowance,'Lembur':s.overtime,'Bonus':s.bonus,'BPJS TK':s.bpjs_ketenagakerjaan,'BPJS Kes':s.bpjs_kesehatan,'PPh21':s.pph21,'Net Salary':s.net_salary,'Tgl Bayar':s.payment_date||''}))
    const ws=XLSX.utils.json_to_sheet(rows);const wb=XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb,ws,'Payroll')
    XLSX.writeFile(wb,`payroll-${MONTHS_ID[filterMonth]}-${filterYear}.xlsx`)
    flash('✓ Export berhasil')
  }

  const numIn = (k:string,label:string) => (
    <div><label className="form-label">{label}</label>
      <input type="number" value={form[k]} onChange={e=>fv(k,parseInt(e.target.value)||0)} className="form-input" min={0}/>
    </div>
  )

  const netPreview = form.basic_salary+form.allowance+form.overtime+form.bonus-form.deduction-form.bpjs_ketenagakerjaan-form.bpjs_kesehatan-form.pph21

  return(
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-[11px] text-center leading-tight">{fmtCurrencyShort(totalNet)}</div><div><div className="text-[13px] font-semibold">Total Payroll {MONTHS_ID[filterMonth]}</div><div className="text-[11.5px] text-slate-400 mt-0.5">+4.2% MoM</div></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-[10px] text-center">{fmtCurrencyShort(avgSalary)}</div><div><div className="text-[13px] font-semibold">Avg Salary/Karyawan</div><div className="text-[11.5px] text-slate-400 mt-0.5">per bulan</div></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-lg">{filtered.length}</div><div><div className="text-[13px] font-semibold">Total Karyawan</div><div className="text-[11.5px] text-slate-400 mt-0.5">{MONTHS_ID[filterMonth]} {filterYear}</div></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold">+12.3%</div><div><div className="text-[13px] font-semibold">Payroll Growth YoY</div><div className="text-[11.5px] text-slate-400 mt-0.5">in line HC</div></div></div>
      </div>

      {/* Yearly chart + by division */}
      <div className="grid grid-cols-3 gap-4">
        {/* Bar chart per bulan */}
        <div className="col-span-2 card">
          <div className="card-head">
            <span className="card-title">Total Payroll per Bulan — {filterYear}</span>
            <div className="flex gap-2">
              {[2026,2025,2024].map(y=>(
                <button key={y} onClick={()=>setFilterYear(y)}
                  className={cn('px-3 py-1 rounded-lg text-[11.5px] font-semibold border transition-all',
                    filterYear===y?'bg-[#0f1e3d] text-white border-[#0f1e3d]':'bg-white text-slate-500 border-slate-200 hover:border-slate-400')}>
                  {y}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body">
            <div className="flex items-end gap-1.5 h-36">
              {yearlyData.map((d,i)=>{
                const pct  = maxTotal>0 ? Math.max((d.total/maxTotal)*100,0) : 0
                const isActive = (i+1)===filterMonth
                return(
                  <button key={d.month} onClick={()=>setFilterMonth(i+1)}
                    className="flex-1 flex flex-col items-center gap-1 group">
                    {d.total>0&&<div className="text-[8px] text-slate-400 group-hover:text-slate-600">{fmtCurrencyShort(d.total).replace('Rp ','')}</div>}
                    <div className="w-full flex items-end" style={{height:100}}>
                      <div className={cn('w-full rounded-t-md transition-all',isActive?'bg-[#0f1e3d]':d.total>0?'bg-teal-400 hover:bg-teal-500':'bg-slate-100 hover:bg-slate-200')}
                        style={{height:`${pct||4}%`}}/>
                    </div>
                    <div className={cn('text-[9.5px] font-semibold',isActive?'text-[#0f1e3d]':'text-slate-400')}>{d.month}</div>
                  </button>
                )
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex gap-4 text-[11px] text-slate-400">
              <span>Klik bulan untuk filter tabel</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-[#0f1e3d] inline-block"/>Bulan aktif</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-teal-400 inline-block"/>Bulan lain</span>
            </div>
          </div>
        </div>

        {/* By division + ringkasan */}
        <div className="flex flex-col gap-4">
          <div className="card flex-1">
            <div className="card-head"><span className="card-title">By Division</span></div>
            <div className="card-body space-y-2">
              {divData.length>0
                ?divData.map(([div,total])=>(
                  <InlineBar key={div} label={div} value={fmtCurrencyShort(total as number)} pct={Math.round((total as number/maxDiv)*100)} color="bg-[#0f1e3d]"/>
                ))
                :<div className="text-center text-slate-400 text-[12px] py-4">Belum ada data bulan ini</div>
              }
            </div>
          </div>
          <div className="card">
            <div className="card-head"><span className="card-title">Ringkasan {MONTHS_ID[filterMonth]}</span></div>
            <div className="card-body">
              {[
                {label:'Gaji pokok',  val:filtered.reduce((s,r)=>s+r.basic_salary,0)},
                {label:'Tunjangan',   val:filtered.reduce((s,r)=>s+r.allowance,0)},
                {label:'Lembur',      val:filtered.reduce((s,r)=>s+r.overtime,0)},
                {label:'Bonus',       val:filtered.reduce((s,r)=>s+r.bonus,0)},
                {label:'BPJS',        val:filtered.reduce((s,r)=>s+r.bpjs_ketenagakerjaan+r.bpjs_kesehatan,0)},
                {label:'PPh21',       val:filtered.reduce((s,r)=>s+r.pph21,0)},
              ].map(r=>(
                <div key={r.label} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                  <span className="text-[11.5px] text-slate-400">{r.label}</span>
                  <span className="text-[12px] font-semibold text-slate-800">{fmtCurrencyShort(r.val)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 mt-1">
                <span className="text-[12.5px] font-semibold text-slate-800">Total Take Home</span>
                <span className="text-[14px] font-bold text-teal-600">{fmtCurrencyShort(totalNet)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <div className="card-head">
          <div className="flex items-center gap-3">
            <span className="card-title">Detail Salary</span>
            <select value={filterMonth} onChange={e=>setFilterMonth(parseInt(e.target.value))} className="form-input !w-auto py-1 text-[11.5px]">
              {MONTHS_ID.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <select value={filterYear} onChange={e=>setFilterYear(parseInt(e.target.value))} className="form-input !w-auto py-1 text-[11.5px]">
              <option value={2026}>2026</option><option value={2025}>2025</option><option value={2024}>2024</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            {msg&&<span className={cn('text-[11px] font-medium',msg.startsWith('✓')?'text-teal-600':'text-red-500')}>{msg}</span>}
            <button onClick={exportXls} className="btn btn-ghost btn-sm"><Download size={12}/> Export</button>
            <button onClick={openAdd} className="btn btn-teal btn-sm"><Plus size={12}/> Input Salary</button>
          </div>
        </div>
        <table className="tbl">
          <thead><tr><th>Karyawan</th><th>Divisi</th><th>Gaji Pokok</th><th>Tunjangan</th><th>Lembur</th><th>Bonus</th><th>Potongan</th><th>Take Home</th><th className="text-center">Aksi</th></tr></thead>
          <tbody>
            {filtered.map(s=>(
              <tr key={s.id}>
                <td className="font-semibold">{s.employee?.full_name}</td>
                <td className="text-[12px] text-slate-400">{s.employee?.division}</td>
                <td className="text-[12.5px]">{fmtCurrencyShort(s.basic_salary)}</td>
                <td className="text-[12.5px]">{fmtCurrencyShort(s.allowance)}</td>
                <td className="text-[12.5px]">{fmtCurrencyShort(s.overtime)}</td>
                <td className="text-[12.5px]">{fmtCurrencyShort(s.bonus)}</td>
                <td className="text-[12.5px] text-red-500">{fmtCurrencyShort(s.bpjs_ketenagakerjaan+s.bpjs_kesehatan+s.pph21)}</td>
                <td className="font-bold text-teal-600 text-[13px]">{fmtCurrencyShort(s.net_salary)}</td>
                <td><div className="flex items-center justify-center gap-1">
                  <button onClick={()=>openEdit(s)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400"><Pencil size={12}/></button>
                  <button onClick={()=>del(s.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-500 text-slate-400"><Trash2 size={12}/></button>
                </div></td>
              </tr>
            ))}
            {filtered.length===0&&<EmptyState message={`Belum ada data salary ${MONTHS_ID[filterMonth]} ${filterYear}`}/>}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal&&(
        <Modal title={editId?'Edit Salary':'Input Salary Karyawan'} onClose={()=>setShowModal(false)} size="lg">
          <div className="space-y-3">
            <div><label className="form-label">Karyawan *</label>
              <select value={form.employee_id} onChange={e=>fv('employee_id',e.target.value)} className="form-input">
                <option value="">Pilih karyawan...</option>
                {employees.map(e=><option key={e.id} value={e.id}>{e.full_name} — {e.division}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Bulan</label>
                <select value={form.month} onChange={e=>fv('month',parseInt(e.target.value))} className="form-input">
                  {MONTHS_ID.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div><label className="form-label">Tahun</label>
                <input type="number" value={form.year} onChange={e=>fv('year',parseInt(e.target.value))} className="form-input"/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {numIn('basic_salary','Gaji Pokok (Rp)')}
              {numIn('allowance','Tunjangan (Rp)')}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {numIn('overtime','Lembur (Rp)')}
              {numIn('bonus','Bonus (Rp)')}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {numIn('bpjs_ketenagakerjaan','BPJS TK (Rp)')}
              {numIn('bpjs_kesehatan','BPJS Kes (Rp)')}
              {numIn('pph21','PPh21 (Rp)')}
            </div>
            <div><label className="form-label">Tgl Pembayaran</label>
              <input type="date" value={form.payment_date} onChange={e=>fv('payment_date',e.target.value)} className="form-input"/>
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">
              <div className="text-[10.5px] text-teal-700 font-semibold mb-0.5">Estimasi Take Home</div>
              <div className="text-[16px] font-bold text-teal-700">{fmtCurrencyShort(netPreview)}</div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={()=>setShowModal(false)} className="btn btn-ghost">Batal</button>
              <button onClick={save} disabled={saving} className="btn btn-teal">{saving?'Menyimpan...':editId?'Update':'Simpan'}</button>
            </div>
          </div>
        </Modal>
      )}

      <div className="grid grid-cols-2 gap-3">
        <InsightCard title="Payroll growth in line dengan HC growth" text="Cost per head turun — hiring lebih banyak di level junior. Positif untuk efisiensi."/>
        <InsightCard title="Operations: cost per head tertinggi" text="4 karyawan senior di Operations punya cost per head tertinggi. Evaluasi ROI vs output aktual." color="bg-[#1a2d5a]" titleColor="text-teal-200"/>
      </div>
    </div>
  )
}
