'use client'
import { useState, useRef } from 'react'
import { Plus, Pencil, Trash2, Download, Upload } from 'lucide-react'
import { KPICard, Badge, InlineBar, InsightCard, EmptyState } from '@/components/ui'
import { fmtCurrencyShort, cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import * as XLSX from 'xlsx'

const MONTHS_ID = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const EMPTY = { employee_id:'', year:2026, month:5, basic_salary:0, allowance:0, overtime:0, bonus:0, deduction:0, bpjs_ketenagakerjaan:0, bpjs_kesehatan:0, pph21:0, payment_date:'', notes:'' }

export default function PayrollClient({ salary: initSal, employees }: { salary: any[]; employees: any[] }) {
  const [salary, setSalary] = useState(initSal)
  const [filterMonth, setFilterMonth] = useState(5)
  const [filterYear, setFilterYear]   = useState(2026)
  const [showModal, setShowModal]     = useState(false)
  const [editId, setEditId]           = useState<string|null>(null)
  const [saving, setSaving]           = useState(false)
  const [form, setForm]               = useState<any>(EMPTY)
  const fv = (k:string,v:any) => setForm((p:any)=>({...p,[k]:v}))
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const flash = (t:string)=>{setMsg(t);setTimeout(()=>setMsg(''),4000)}

  const filtered = salary.filter(s => s.year === filterYear && s.month === filterMonth)
  const totalNet = filtered.reduce((s,r)=>s+(r.net_salary??0),0)
  const avgSalary = filtered.length>0 ? Math.round(totalNet/filtered.length) : 0
  const unpaid = filtered.filter(r=>!r.is_paid)

  const byDiv: Record<string,number> = {}
  filtered.forEach(r=>{ const d=r.employee?.division??'Unknown'; byDiv[d]=(byDiv[d]||0)+(r.net_salary??0) })
  const divData = Object.entries(byDiv).sort((a,b)=>b[1]-a[1])
  const maxDiv = divData[0]?.[1]||1

  function openAdd() { setForm({...EMPTY,month:filterMonth,year:filterYear}); setEditId(null); setShowModal(true) }
  function openEdit(s:any) {
    setForm({ employee_id:s.employee_id, year:s.year, month:s.month,
      basic_salary:s.basic_salary||0, allowance:s.allowance||0, overtime:s.overtime||0, bonus:s.bonus||0,
      deduction:s.deduction||0, bpjs_ketenagakerjaan:s.bpjs_ketenagakerjaan||0,
      bpjs_kesehatan:s.bpjs_kesehatan||0, pph21:s.pph21||0, payment_date:s.payment_date||'', notes:s.notes||'' })
    setEditId(s.id); setShowModal(true)
  }

  async function save() {
    if (!form.employee_id) { alert('Pilih karyawan'); return }
    setSaving(true)
    try {
      if (editId) {
        const res = await fetch('/api/salary',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editId,...form})})
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        const emp = employees.find(e=>e.id===form.employee_id)
        setSalary(prev=>prev.map(s=>s.id===editId?{...data.data,employee:emp}:s))
      } else {
        const res = await fetch('/api/salary',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        const emp = employees.find(e=>e.id===form.employee_id)
        setSalary(prev=>[{...data.data,employee:emp},...prev])
      }
      setShowModal(false)
    } catch(err:any){alert('Error: '+err.message)}
    setSaving(false)
  }

  async function del(id:string) {
    if (!confirm('Hapus data salary ini?')) return
    await fetch(`/api/salary?id=${id}`,{method:'DELETE'})
    setSalary(prev=>prev.filter(s=>s.id!==id))
  }

  function exportXls(){
    const rows=filtered.map(s=>({'Nama':s.employee?.full_name||'','Divisi':s.employee?.division||'','Bulan':s.month,'Tahun':s.year,'Gaji Pokok':s.basic_salary,'Tunjangan':s.allowance,'Lembur':s.overtime,'Bonus':s.bonus,'BPJS TK':s.bpjs_ketenagakerjaan,'BPJS Kes':s.bpjs_kesehatan,'PPh21':s.pph21,'Net Salary':s.net_salary,'Tgl Bayar':s.payment_date||''}))
    const ws=XLSX.utils.json_to_sheet(rows);const wb=XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb,ws,'Payroll');XLSX.writeFile(wb,`payroll-${MONTHS_ID[filterMonth]}-${filterYear}.xlsx`)
    flash('✓ Export berhasil')
  }

  const numInput = (k:string, label:string) => (
    <div><label className="form-label">{label}</label>
      <input type="number" value={form[k]} onChange={e=>fv(k,parseInt(e.target.value)||0)} className="form-input" min={0}/>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3">
        <KPICard label={`Total payroll ${MONTHS_ID[filterMonth]}`} value={fmtCurrencyShort(totalNet)} change="+4.2% MoM" changeType="up" accent="bg-teal-400"/>
        <KPICard label="Avg salary/karyawan" value={fmtCurrencyShort(avgSalary)} accent="bg-blue-400"/>
        <KPICard label="Belum dibayar" value={unpaid.length} change={unpaid.length>0?'perlu action':'semua lunas'} changeType={unpaid.length>0?'down':'flat'} accent="bg-amber-400"/>
        <KPICard label="Payroll growth YoY" value="+12.3%" change="in line HC" changeType="up" accent="bg-purple-400"/>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="card-head"><span className="card-title">Payroll by division</span></div>
          <div className="card-body space-y-2">
            {divData.map(([div,total])=>(
              <InlineBar key={div} label={div} value={fmtCurrencyShort(total as number)} pct={Math.round((total as number/maxDiv)*100)} color="bg-[#0f1e3d]"/>
            ))}
            {divData.length===0&&<div className="text-center text-slate-300 text-[11px] py-4">Tidak ada data</div>}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><span className="card-title">Ringkasan {MONTHS_ID[filterMonth]} {filterYear}</span></div>
          <div className="card-body">
            {[
              {label:'Total gaji pokok', val:filtered.reduce((s,r)=>s+r.basic_salary,0)},
              {label:'Total tunjangan',  val:filtered.reduce((s,r)=>s+r.allowance,0)},
              {label:'Total lembur',     val:filtered.reduce((s,r)=>s+r.overtime,0)},
              {label:'Total bonus',      val:filtered.reduce((s,r)=>s+r.bonus,0)},
              {label:'Total BPJS',       val:filtered.reduce((s,r)=>s+r.bpjs_ketenagakerjaan+r.bpjs_kesehatan,0)},
              {label:'Total PPh21',      val:filtered.reduce((s,r)=>s+r.pph21,0)},
            ].map(r=>(
              <div key={r.label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                <span className="text-[11.5px] text-slate-400">{r.label}</span>
                <span className="text-[12px] font-bold text-slate-800">{fmtCurrencyShort(r.val)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t border-slate-200 mt-1">
              <span className="text-[12px] font-bold text-slate-800">Total take home</span>
              <span className="text-[14px] font-extrabold text-teal-600">{fmtCurrencyShort(totalNet)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <div className="card-head">
          <div className="flex items-center gap-3">
            <span className="card-title">Detail salary</span>
            <select value={filterMonth} onChange={e=>setFilterMonth(parseInt(e.target.value))} className="form-input !w-auto py-1 text-[11px]">
              {MONTHS_ID.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <select value={filterYear} onChange={e=>setFilterYear(parseInt(e.target.value))} className="form-input !w-auto py-1 text-[11px]">
              <option value={2026}>2026</option><option value={2025}>2025</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            {msg&&<span className="text-[11px] text-teal-600 font-medium">{msg}</span>}
            {unpaid.length>0&&<Badge variant="red">{unpaid.length} belum lunas</Badge>}
            <button onClick={exportXls} className="btn btn-ghost btn-sm"><Download size={12}/> Export</button>
            <button onClick={openAdd} className="btn btn-teal btn-sm"><Plus size={12}/> Input salary</button>
          </div>
        </div>
        <table className="tbl">
          <thead><tr>
            <th>Karyawan</th><th>Divisi</th><th>Gaji pokok</th><th>Tunjangan</th>
            <th>Lembur</th><th>Bonus</th><th>Potongan</th><th>Take home</th>
            <th className="text-center">Aksi</th>
          </tr></thead>
          <tbody>
            {filtered.map(s=>(
              <tr key={s.id}>
                <td className="font-bold">{s.employee?.full_name}</td>
                <td className="text-[11px] text-slate-400">{s.employee?.division}</td>
                <td className="text-[11.5px]">{fmtCurrencyShort(s.basic_salary)}</td>
                <td className="text-[11.5px]">{fmtCurrencyShort(s.allowance)}</td>
                <td className="text-[11.5px]">{fmtCurrencyShort(s.overtime)}</td>
                <td className="text-[11.5px]">{fmtCurrencyShort(s.bonus)}</td>
                <td className="text-[11.5px] text-red-600">{fmtCurrencyShort(s.bpjs_ketenagakerjaan+s.bpjs_kesehatan+s.pph21)}</td>
                <td className="font-extrabold text-teal-600">{fmtCurrencyShort(s.net_salary)}</td>
                <td><div className="flex items-center justify-center gap-1">
                  <button onClick={()=>openEdit(s)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400"><Pencil size={12}/></button>
                  <button onClick={()=>del(s.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-400"><Trash2 size={12}/></button>
                </div></td>
              </tr>
            ))}
            {filtered.length===0&&<EmptyState message={`Belum ada data salary ${MONTHS_ID[filterMonth]} ${filterYear}`}/>}
          </tbody>
        </table>
      </div>

      {showModal&&(
        <Modal title={editId?'Edit salary':'Input salary karyawan'} onClose={()=>setShowModal(false)} size="lg">
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
              {numInput('basic_salary','Gaji pokok (Rp)')}
              {numInput('allowance','Tunjangan (Rp)')}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {numInput('overtime','Lembur (Rp)')}
              {numInput('bonus','Bonus (Rp)')}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {numInput('bpjs_ketenagakerjaan','BPJS TK (Rp)')}
              {numInput('bpjs_kesehatan','BPJS Kes (Rp)')}
              {numInput('pph21','PPh21 (Rp)')}
            </div>
            <div><label className="form-label">Tgl pembayaran</label>
              <input type="date" value={form.payment_date} onChange={e=>fv('payment_date',e.target.value)} className="form-input"/>
            </div>
            <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">
              <div className="text-[10.5px] text-teal-700 font-bold mb-1">Estimasi take home pay</div>
              <div className="text-[16px] font-extrabold text-teal-700">
                {fmtCurrencyShort(form.basic_salary+form.allowance+form.overtime+form.bonus-form.deduction-form.bpjs_ketenagakerjaan-form.bpjs_kesehatan-form.pph21)}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={()=>setShowModal(false)} className="btn btn-ghost">Batal</button>
              <button onClick={save} disabled={saving} className="btn btn-teal">{saving?'Menyimpan...':editId?'Update':'Simpan'}</button>
            </div>
          </div>
        </Modal>
      )}

      <div className="grid grid-cols-2 gap-3">
        <InsightCard title="Payroll +4.2% MoM — in line dengan HC growth" text="Cost per head turun dari Rp 8.1 Jt ke Rp 7.6 Jt — hiring lebih banyak di level junior. Positif untuk efisiensi cost."/>
        <InsightCard title="Operations: cost per head tertinggi" text="4 karyawan senior di Operations punya cost per head tertinggi. Evaluasi ROI vs output aktual." color="bg-blue-900/70" titleColor="text-blue-300"/>
      </div>
    </div>
  )
}
