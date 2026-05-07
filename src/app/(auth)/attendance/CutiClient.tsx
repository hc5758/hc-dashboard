'use client'
import { useState, useMemo } from 'react'
import { Plus, ChevronLeft, ChevronRight, Bell, Trash2, Pencil } from 'lucide-react'
import { KPICard, Badge, EmptyState } from '@/components/ui'
import { fmtDate, calcYoS, cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const DAYS   = ['Sen','Sel','Rab','Kam','Jum','Sab','Min']

const LEAVE_TYPES = [
  { key:'Tahunan',      label:'Cuti Tahunan',      color:'bg-teal-500',    badge:'teal',   balanceKey:'annual' },
  { key:'Sakit',        label:'Sakit',              color:'bg-blue-500',    badge:'blue',   balanceKey:'sick' },
  { key:'Penting',      label:'Cuti Khusus',        color:'bg-amber-500',   badge:'amber',  balanceKey:null },
  { key:'Melahirkan',   label:'Melahirkan',         color:'bg-purple-500',  badge:'purple', balanceKey:null },
  { key:'Cuti Bersama', label:'Cuti Bersama',       color:'bg-slate-600',   badge:'navy',   balanceKey:null },
  { key:'Overtime',     label:'Kompensasi Overtime',color:'bg-green-500',   badge:'green',  balanceKey:'overtime' },
  { key:'Unpaid',       label:'Unpaid Leave',       color:'bg-gray-400',    badge:'gray',   balanceKey:null },
]

const SPECIAL_TYPES = [
  { key:'Ulang Tahun',  entitled:1, label:'Ulang Tahun (1 hr)' },
  { key:'Menikah',      entitled:3, label:'Menikah (3 hr)' },
  { key:'Khitan/Baptis',entitled:2, label:'Khitan/Baptis Anak (2 hr)' },
  { key:'Paternity',    entitled:2, label:'Istri Melahirkan/Keguguran (2 hr)' },
  { key:'Duka Inti',    entitled:2, label:'Kedukaan Keluarga Inti (2 hr)' },
  { key:'Duka Serumah', entitled:1, label:'Kedukaan Keluarga Serumah (1 hr)' },
]

// Hak cuti tahunan: selalu 12 hari
function calcAnnualEntitled(_joinDate: string): number { return 12 }

// Carry-over max 5 hr, hangus setelah Juni
function calcCarryOver(prevRemaining: number): number {
  const now = new Date()
  if (now.getMonth() >= 6) return 0 // Juli+ = hangus
  return Math.min(prevRemaining, 5)
}

// Cuti yang TIDAK ngurangin saldo tahunan
const NON_ANNUAL_TYPES = ['Sakit','Penting','Melahirkan','Cuti Bersama','Overtime','Unpaid']

const EMPTY_LEAVE = { employee_id:'', leave_type:'Tahunan', special_type:'', start_date:'', end_date:'', total_days:1, annual_days:0, special_days:0, is_combined:false, status:'Approved', notes:'' }
const EMPTY_BAL   = { employee_id:'', year:2026, annual_entitled:12, annual_carryover:0, overtime_entitled:0, notes:'' }

export default function CutiClient({ leave:initLeave, employees, balances:initBal }: { leave:any[]; employees:any[]; balances:any[] }) {
  const today = new Date()
  const [leave, setLeave]       = useState(initLeave)
  const [balances, setBalances] = useState(initBal)
  const [calY, setCalY]         = useState(today.getFullYear())
  const [calM, setCalM]         = useState(today.getMonth())
  const [selected, setSelected] = useState<string|null>(null)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showBalModal, setShowBalModal]     = useState(false)
  const [showOTModal, setShowOTModal]       = useState(false)
  const [editId, setEditId]     = useState<string|null>(null)
  const [saving, setSaving]     = useState(false)
  const [leaveForm, setLeaveForm] = useState<any>(EMPTY_LEAVE)
  const [balForm, setBalForm]     = useState<any>(EMPTY_BAL)
  const [activeTab, setActiveTab] = useState<'calendar'|'saldo'>('calendar')
  const [saldoYear, setSaldoYear] = useState(2026)
  const lf = (k:string,v:any) => setLeaveForm((p:any)=>({...p,[k]:v}))
  const bf = (k:string,v:any) => setBalForm((p:any)=>({...p,[k]:v}))

  // ── Helpers ──────────────────────────────────────────────
  // Auto-calculate saldo tanpa perlu init manual
  function getSaldo(empId:string, year:number=2026) {
    const emp = employees.find(e=>e.id===empId)
    const bal = balances.find(b=>b.employee_id===empId&&b.year===year)
    
    // Saldo tahunan
    const annualEntitled = bal?.annual_entitled ?? calcAnnualEntitled(emp?.join_date)
    // Carry-over dari tahun sebelumnya (ambil dari balance tahun lalu jika ada)
    const prevBal = balances.find(b=>b.employee_id===empId&&b.year===year-1)
    const prevRemaining = prevBal ? (prevBal.annual_entitled + (prevBal.annual_carryover||0)) - (prevBal.annual_used||0) : 0
    const carryOver = bal?.annual_carryover ?? calcCarryOver(prevRemaining)
    // Hanya cuti Tahunan yang ngurangi saldo
    const annualUsed = leave.filter(l=>l.employee_id===empId&&l.leave_type==='Tahunan'&&l.status==='Approved'&&new Date(l.start_date).getFullYear()===year).reduce((s,l)=>s+l.total_days,0)
    const annualTotal = annualEntitled + carryOver
    const annualLeft  = annualTotal - annualUsed

    // Cuti khusus (sakit, ulang tahun, dll) — tidak ngurangi tahunan
    const sickUsed      = leave.filter(l=>l.employee_id===empId&&l.leave_type==='Sakit'&&l.status==='Approved'&&new Date(l.start_date).getFullYear()===year).reduce((s,l)=>s+l.total_days,0)
    const specialUsed   = leave.filter(l=>l.employee_id===empId&&l.leave_type==='Penting'&&l.status==='Approved'&&new Date(l.start_date).getFullYear()===year).reduce((s,l)=>s+l.total_days,0)
    const otEntitled    = bal?.overtime_entitled ?? 0
    const otUsed        = leave.filter(l=>l.employee_id===empId&&l.leave_type==='Overtime'&&l.status==='Approved'&&new Date(l.start_date).getFullYear()===year).reduce((s,l)=>s+l.total_days,0)

    return { annualEntitled, carryOver, annualTotal, annualUsed, annualLeft, sickUsed, specialUsed, otEntitled, otUsed, otLeft: otEntitled-otUsed }
  }

  // ── Calendar ─────────────────────────────────────────────
  const leaveThisMonth = useMemo(()=>leave.filter(l=>{
    const s=new Date(l.start_date),e=new Date(l.end_date)
    const ms=new Date(calY,calM,1),me=new Date(calY,calM+1,0)
    return s<=me&&e>=ms&&l.status==='Approved'
  }),[leave,calY,calM])

  const dayMap = useMemo(()=>{
    const map:Record<string,any[]>={}
    leaveThisMonth.forEach(l=>{
      const s=new Date(l.start_date),e=new Date(l.end_date)
      for(let d=new Date(s);d<=e;d.setDate(d.getDate()+1)){
        const key=d.toISOString().slice(0,10)
        if(!map[key])map[key]=[]
        map[key].push(l)
      }
    })
    return map
  },[leaveThisMonth])

  const upcoming = useMemo(()=>{
    const now=new Date();now.setHours(0,0,0,0)
    const in7=new Date(now.getTime()+7*86400000)
    return leave.filter(l=>{const s=new Date(l.start_date);s.setHours(0,0,0,0);return s>=now&&s<=in7&&l.status==='Approved'})
      .sort((a,b)=>new Date(a.start_date).getTime()-new Date(b.start_date).getTime())
  },[leave])

  const firstDay=new Date(calY,calM,1).getDay()
  const offset=firstDay===0?6:firstDay-1
  const daysInMonth=new Date(calY,calM+1,0).getDate()
  const todayStr=today.toISOString().slice(0,10)
  function prevMonth(){if(calM===0){setCalM(11);setCalY(y=>y-1)}else setCalM(m=>m-1);setSelected(null)}
  function nextMonth(){if(calM===11){setCalM(0);setCalY(y=>y+1)}else setCalM(m=>m+1);setSelected(null)}

  // ── CRUD Leave ───────────────────────────────────────────
  function onDateChange(field:'start_date'|'end_date',val:string){
    const next={...leaveForm,[field]:val}
    if(next.start_date&&next.end_date){next.total_days=Math.max(1,Math.round((new Date(next.end_date).getTime()-new Date(next.start_date).getTime())/86400000)+1)}
    setLeaveForm(next)
  }

  function openAdd(dateStr?:string){
    setLeaveForm({...EMPTY_LEAVE,start_date:dateStr||'',end_date:dateStr||''})
    setEditId(null);setShowLeaveModal(true)
  }
  function openEdit(l:any){
    setLeaveForm({employee_id:l.employee_id,leave_type:l.leave_type,special_type:l.special_type||'',start_date:l.start_date,end_date:l.end_date,total_days:l.total_days,status:l.status,notes:l.notes||''})
    setEditId(l.id);setShowLeaveModal(true)
  }

  async function saveLeave(){
    if(!leaveForm.employee_id||!leaveForm.start_date||!leaveForm.end_date){alert('Pilih karyawan dan tanggal');return}
    setSaving(true)
    try{
      const year=new Date(leaveForm.start_date).getFullYear()

      if(leaveForm.is_combined){
        // Simpan 2 record terpisah
        if(leaveForm.annual_days>0){
          const r1={employee_id:leaveForm.employee_id,leave_type:'Tahunan',start_date:leaveForm.start_date,end_date:leaveForm.end_date,total_days:leaveForm.annual_days,status:leaveForm.status,notes:`[Gabungan] ${leaveForm.notes||''}`.trim(),year}
          const res=await fetch('/api/leave',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(r1)})
          const data=await res.json();if(!res.ok)throw new Error(data.error)
          const emp=employees.find(e=>e.id===leaveForm.employee_id)
          setLeave(prev=>[{...data.data,employee:emp},...prev])
        }
        if(leaveForm.special_days>0){
          const r2={employee_id:leaveForm.employee_id,leave_type:'Penting',special_type:leaveForm.special_type,start_date:leaveForm.start_date,end_date:leaveForm.end_date,total_days:leaveForm.special_days,status:leaveForm.status,notes:`[Gabungan - Khusus] ${leaveForm.notes||''}`.trim(),year}
          const res=await fetch('/api/leave',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(r2)})
          const data=await res.json();if(!res.ok)throw new Error(data.error)
          const emp=employees.find(e=>e.id===leaveForm.employee_id)
          setLeave(prev=>[{...data.data,employee:emp},...prev])
        }
        await updateBalanceUsed(leaveForm.employee_id,'annual')
      } else {
        const payload={...leaveForm,year}
        if(editId){
          const res=await fetch('/api/leave',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editId,...payload})})
          const data=await res.json();if(!res.ok)throw new Error(data.error)
          const emp=employees.find(e=>e.id===leaveForm.employee_id)
          setLeave(prev=>prev.map(l=>l.id===editId?{...data.data,employee:emp}:l))
        }else{
          const res=await fetch('/api/leave',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
          const data=await res.json();if(!res.ok)throw new Error(data.error)
          const emp=employees.find(e=>e.id===leaveForm.employee_id)
          setLeave(prev=>[{...data.data,employee:emp},...prev])
        }
        if(leaveForm.leave_type==='Tahunan') await updateBalanceUsed(leaveForm.employee_id,'annual')
        if(leaveForm.leave_type==='Overtime') await updateBalanceUsed(leaveForm.employee_id,'overtime')
      }
      setShowLeaveModal(false)
    }catch(err:any){alert('Error: '+err.message)}
    setSaving(false)
  }

  async function updateBalanceUsed(empId:string, type:string){
    const bal=balances.find(b=>b.employee_id===empId)
    if(!bal) return
    const used=leave.filter(l=>l.employee_id===empId&&l.leave_type===(type==='annual'?'Tahunan':'Overtime')&&l.status==='Approved').reduce((s,l)=>s+l.total_days,0)
    await fetch('/api/leave-balance',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:bal.id,[`${type}_used`]:used})})
    setBalances(prev=>prev.map(b=>b.id===bal.id?{...b,[`${type}_used`]:used}:b))
  }

  async function delLeave(id:string){
    if(!confirm('Hapus data cuti ini?'))return
    await fetch(`/api/leave?id=${id}`,{method:'DELETE'})
    setLeave(prev=>prev.filter(l=>l.id!==id))
  }

  // ── Init balance for employee ─────────────────────────────
  async function initBalance(empId:string){
    const emp=employees.find(e=>e.id===empId)
    const entitled=calcAnnualEntitled(emp?.join_date)
    const payload={employee_id:empId,year:2026,annual_entitled:entitled,annual_carryover:0,annual_used:0,overtime_entitled:0,overtime_used:0,sick_used:0}
    const res=await fetch('/api/leave-balance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    const data=await res.json()
    if(res.ok&&data.data){setBalances(prev=>[{...data.data,employee:emp},...prev])}
  }

  // ── Save balance (init/edit) ──────────────────────────────
  async function saveBalance(){
    if(!balForm.employee_id){alert('Pilih karyawan');return}
    setSaving(true)
    try{
      const res=await fetch('/api/leave-balance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(balForm)})
      const data=await res.json();if(!res.ok)throw new Error(data.error)
      const emp=employees.find(e=>e.id===balForm.employee_id)
      setBalances(prev=>{
        const exists=prev.find(b=>b.employee_id===balForm.employee_id)
        if(exists)return prev.map(b=>b.employee_id===balForm.employee_id?{...data.data,employee:emp}:b)
        return [{...data.data,employee:emp},...prev]
      })
      setShowBalModal(false)
    }catch(err:any){alert('Error: '+err.message)}
    setSaving(false)
  }

  // ── Save overtime addition ────────────────────────────────
  async function saveOT(empId:string, addDays:number, note:string){
    const bal=balances.find(b=>b.employee_id===empId)
    const current=bal?.overtime_entitled??0
    const payload={employee_id:empId,year:2026,overtime_entitled:current+addDays,notes:note}
    const res=await fetch('/api/leave-balance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    const data=await res.json()
    if(res.ok&&data.data){
      const emp=employees.find(e=>e.id===empId)
      setBalances(prev=>{
        const exists=prev.find(b=>b.employee_id===empId)
        if(exists)return prev.map(b=>b.employee_id===empId?{...data.data,employee:emp}:b)
        return [{...data.data,employee:emp},...prev]
      })
    }
    setShowOTModal(false)
  }

  const selectedLeave = selected?(dayMap[selected]??[]):[]
  const typeColorMap = LEAVE_TYPES.reduce((a,t)=>({...a,[t.key]:t.color}),{} as Record<string,string>)
  const typeBadgeMap = LEAVE_TYPES.reduce((a,t)=>({...a,[t.key]:t.badge}),{} as Record<string,string>)

  return(
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-red-500 font-bold text-lg">{leave.filter(l=>{const s=new Date(l.start_date),e=new Date(l.end_date);return today>=s&&today<=e&&l.status==='Approved'}).length}</div><div><div className="text-[13px] font-semibold">Cuti Hari Ini</div><div className="text-[11.5px] text-slate-400 mt-0.5">sedang cuti</div></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-lg">{leaveThisMonth.length}</div><div><div className="text-[13px] font-semibold">Cuti Bulan {MONTHS[calM]}</div><div className="text-[11.5px] text-slate-400 mt-0.5">disetujui</div></div></div>
        <div className="card p-4 flex items-center gap-3"><div className={cn('w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg',upcoming.length>0?'bg-amber-50 text-amber-600':'bg-slate-50 text-slate-400')}>{upcoming.length}</div><div><div className="text-[13px] font-semibold">Reminder &lt;7 Hari</div><div className="text-[11.5px] text-slate-400 mt-0.5">akan cuti</div></div></div>
        <div className="card p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">{employees.length}</div><div><div className="text-[13px] font-semibold">Total Karyawan</div><div className="text-[11.5px] text-slate-400 mt-0.5">aktif {new Date().getFullYear()}</div></div></div>
      </div>

      {/* Reminder */}
      {upcoming.length>0&&(
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Bell size={15} className="text-amber-600"/><span className="text-[12px] font-semibold text-amber-800">Reminder — {upcoming.length} karyawan akan cuti dalam 7 hari ke depan</span></div>
          <div className="flex flex-wrap gap-2">
            {upcoming.map(l=>(
              <div key={l.id} className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-1.5">
                <div className={cn('w-2 h-2 rounded-full',typeColorMap[l.leave_type]??'bg-gray-400')}/>
                <span className="text-[11.5px] font-semibold text-slate-800">{l.employee?.full_name}</span>
                <span className="text-[10.5px] text-slate-400">{fmtDate(l.start_date)}{l.start_date!==l.end_date?` – ${fmtDate(l.end_date)}`:''}</span>
                <Badge variant={(typeBadgeMap[l.leave_type]??'gray') as any}>{l.leave_type}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {([{key:'calendar',label:'📅 Kalender Cuti'},{key:'saldo',label:'💼 Saldo Cuti Karyawan'}] as const).map(t=>(
          <button key={t.key} onClick={()=>setActiveTab(t.key)}
            className={cn('px-5 py-2 rounded-lg text-[12.5px] font-semibold transition-all',
              activeTab===t.key?'bg-white shadow-sm text-slate-800':'text-slate-500 hover:text-slate-700')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: KALENDER ── */}
      {activeTab==='calendar'&&(
        <>
          <div className="grid grid-cols-3 gap-4">
            {/* Calendar */}
            <div className="col-span-2 card">
              <div className="card-head">
                <div className="flex items-center gap-3">
                  <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400"><ChevronLeft size={14}/></button>
                  <span className="card-title">{MONTHS[calM]} {calY}</span>
                  <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-400"><ChevronRight size={14}/></button>
                </div>
                <button onClick={()=>openAdd()} className="btn btn-teal btn-sm"><Plus size={12}/> Tambah Cuti</button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-7 mb-1">
                  {DAYS.map(d=><div key={d} className="text-center text-[10px] font-semibold text-slate-400 py-1">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({length:offset}).map((_,i)=><div key={`e${i}`}/>)}
                  {Array.from({length:daysInMonth}).map((_,i)=>{
                    const day=i+1
                    const dateStr=`${calY}-${String(calM+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                    const isToday=dateStr===todayStr
                    const isSel=dateStr===selected
                    const dayLeave=dayMap[dateStr]??[]
                    return(
                      <div key={day} onClick={()=>setSelected(isSel?null:dateStr)}
                        className={cn('rounded-xl p-1.5 cursor-pointer transition-all min-h-[56px] flex flex-col',
                          isToday?'bg-[#0f1e3d] text-white':isSel?'bg-teal-50 border-2 border-teal-400':dayLeave.length>0?'bg-slate-50 hover:bg-slate-100':'hover:bg-slate-50')}>
                        <div className={cn('text-[12px] font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-0.5',isToday?'bg-white text-[#0f1e3d]':'text-slate-700')}>{day}</div>
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                          {dayLeave.slice(0,2).map((l,idx)=>(
                            <div key={idx} className={cn('text-[8px] font-semibold text-white rounded px-1 truncate',typeColorMap[l.leave_type]??'bg-gray-400')}>
                              {l.employee?.full_name?.split(' ')[0]}
                            </div>
                          ))}
                          {dayLeave.length>2&&<div className="text-[8px] text-slate-400">+{dayLeave.length-2}</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-50">
                  {LEAVE_TYPES.map(t=>(
                    <div key={t.key} className="flex items-center gap-1.5">
                      <div className={cn('w-2.5 h-2.5 rounded-sm',t.color)}/>
                      <span className="text-[10px] text-slate-400">{t.key}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right panel */}
            <div className="flex flex-col gap-4">
              <div className="card flex-1">
                {selected?(
                  <>
                    <div className="card-head">
                      <span className="card-title text-[12px]">{new Date(selected+'T00:00:00').toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long'})}</span>
                      <button onClick={()=>openAdd(selected)} className="btn btn-teal btn-sm"><Plus size={11}/></button>
                    </div>
                    {selectedLeave.length===0
                      ?<div className="p-5 text-center text-[12px] text-slate-400">Tidak ada cuti</div>
                      :selectedLeave.map(l=>(
                        <div key={l.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 last:border-0">
                          <div className={cn('w-1.5 h-10 rounded-full flex-shrink-0',typeColorMap[l.leave_type]??'bg-gray-400')}/>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-[12.5px]">{l.employee?.full_name}</div>
                            <div className="text-[10.5px] text-slate-400">{l.employee?.division}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={(typeBadgeMap[l.leave_type]??'gray') as any}>{l.leave_type}</Badge>
                              <span className="text-[10px] text-slate-400">{l.total_days} hari</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={()=>openEdit(l)} className="w-6 h-6 flex items-center justify-center rounded bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400"><Pencil size={11}/></button>
                            <button onClick={()=>delLeave(l.id)} className="w-6 h-6 flex items-center justify-center rounded bg-slate-50 hover:bg-red-50 hover:text-red-500 text-slate-400"><Trash2 size={11}/></button>
                          </div>
                        </div>
                      ))}
                  </>
                ):(
                  <>
                    <div className="card-head"><span className="card-title">Cuti {MONTHS[calM]}</span><Badge variant="teal">{leaveThisMonth.length}</Badge></div>
                    {leaveThisMonth.length===0
                      ?<div className="p-5 text-center text-[12px] text-slate-400">Tidak ada cuti bulan ini</div>
                      :<div className="overflow-y-auto" style={{maxHeight:320}}>
                        {leaveThisMonth.sort((a,b)=>new Date(a.start_date).getTime()-new Date(b.start_date).getTime()).map(l=>(
                          <div key={l.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 last:border-0">
                            <div className={cn('w-1.5 h-8 rounded-full flex-shrink-0',typeColorMap[l.leave_type]??'bg-gray-400')}/>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-[12px] truncate">{l.employee?.full_name}</div>
                              <div className="text-[9.5px] text-slate-400">{fmtDate(l.start_date)} – {fmtDate(l.end_date)}</div>
                            </div>
                            <Badge variant={(typeBadgeMap[l.leave_type]??'gray') as any}>{l.leave_type}</Badge>
                          </div>
                        ))}
                      </div>
                    }
                  </>
                )}
              </div>
              {/* Rekap */}
              <div className="card">
                <div className="card-head"><span className="card-title">Rekap Tipe Cuti</span></div>
                <div className="card-body space-y-2">
                  {Object.entries(leave.filter(l=>l.status==='Approved').reduce((acc:any,l)=>{acc[l.leave_type]=(acc[l.leave_type]||0)+l.total_days;return acc},{})).sort((a:any,b:any)=>b[1]-a[1]).map(([type,days])=>(
                    <div key={type} className="flex justify-between items-center">
                      <div className="flex items-center gap-2"><div className={cn('w-2 h-2 rounded-full',typeColorMap[type as string]??'bg-gray-400')}/><span className="text-[12px] text-slate-600">{type}</span></div>
                      <span className="text-[12px] font-semibold text-slate-800">{days as number} hr</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-x-auto">
            <div className="card-head">
              <span className="card-title">Semua Data Cuti</span>
              <button onClick={()=>openAdd()} className="btn btn-teal btn-sm"><Plus size={12}/> Tambah</button>
            </div>
            <table className="tbl">
              <thead><tr><th>Karyawan</th><th>Divisi</th><th>Tipe</th><th>Mulai</th><th>Selesai</th><th>Total Hari</th><th>Status</th><th className="text-center">Aksi</th></tr></thead>
              <tbody>
                {leave.map(l=>(
                  <tr key={l.id}>
                    <td className="font-semibold">{l.employee?.full_name}</td>
                    <td className="text-[12px] text-slate-400">{l.employee?.division}</td>
                    <td><Badge variant={(typeBadgeMap[l.leave_type]??'gray') as any}>{l.leave_type}</Badge></td>
                    <td className="text-[12px] text-slate-400">{fmtDate(l.start_date)}</td>
                    <td className="text-[12px] text-slate-400">{fmtDate(l.end_date)}</td>
                    <td className="font-semibold">{l.total_days} hari</td>
                    <td><Badge variant={l.status==='Approved'?'teal':l.status==='Rejected'?'red':'amber'}>{l.status}</Badge></td>
                    <td><div className="flex items-center justify-center gap-1">
                      <button onClick={()=>openEdit(l)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400"><Pencil size={12}/></button>
                      <button onClick={()=>delLeave(l.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-500 text-slate-400"><Trash2 size={12}/></button>
                    </div></td>
                  </tr>
                ))}
                {leave.length===0&&<EmptyState message="Belum ada data cuti"/>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── TAB: SALDO CUTI ── */}
      {activeTab==='saldo'&&(
        <div className="space-y-4">
          {/* Info kebijakan */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {icon:'📅',title:'Cuti Tahunan',desc:'12 hr/th (flat untuk semua karyawan) · Carry-over max 5 hr · Hangus jika tidak dipakai sebelum Juli'},
              {icon:'🎂',title:'Cuti Khusus Terencana',desc:'Ulang tahun 1hr · Menikah 3hr · Khitan/Baptis anak 2hr'},
              {icon:'🆘',title:'Cuti Khusus Tidak Terencana',desc:'Istri melahirkan/keguguran 2hr · Kedukaan keluarga inti 2hr · Keluarga serumah 1hr'},
            ].map(i=>(
              <div key={i.title} className="card p-4 flex gap-3">
                <div className="text-2xl flex-shrink-0">{i.icon}</div>
                <div><div className="text-[12.5px] font-semibold text-slate-800 mb-1">{i.title}</div><div className="text-[11.5px] text-slate-500 leading-relaxed">{i.desc}</div></div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-head">
              <div className="flex items-center gap-3">
                <span className="card-title">Saldo Cuti per Karyawan</span>
                <div className="flex gap-2">
                  {[2026,2025,2024].map(y=>(
                    <button key={y} onClick={()=>setSaldoYear(y)}
                      className={cn('px-3 py-1 rounded-lg text-[11.5px] font-semibold border transition-all',
                        saldoYear===y?'bg-[#0f1e3d] text-white border-[#0f1e3d]':'bg-white text-slate-500 border-slate-200 hover:border-slate-400')}>
                      {y}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={()=>setShowOTModal(true)} className="btn btn-teal btn-sm">+ Tambah Overtime Leave</button>
            </div>
            <div className="overflow-x-auto">
              <table className="tbl" style={{minWidth:1000}}>
                <thead>
                  <tr>
                    <th rowSpan={2}>Karyawan</th>
                    <th rowSpan={2}>Divisi</th>
                    <th rowSpan={2}>Masa Kerja</th>
                    <th colSpan={4} className="text-center bg-teal-50 border-b-0">Cuti Tahunan</th>
                    <th colSpan={2} className="text-center bg-blue-50 border-b-0">Cuti Khusus</th>
                    <th colSpan={3} className="text-center bg-green-50 border-b-0">Overtime</th>
                  </tr>
                  <tr>
                    <th className="text-center bg-teal-50 text-[9px]">Hak</th>
                    <th className="text-center bg-teal-50 text-[9px]">Carry-over</th>
                    <th className="text-center bg-teal-50 text-[9px]">Terpakai</th>
                    <th className="text-center bg-teal-50 text-[9px]">Sisa</th>
                    <th className="text-center bg-blue-50 text-[9px]">Sakit</th>
                    <th className="text-center bg-blue-50 text-[9px]">Khusus</th>
                    <th className="text-center bg-green-50 text-[9px]">Hak OT</th>
                    <th className="text-center bg-green-50 text-[9px]">OT Pakai</th>
                    <th className="text-center bg-green-50 text-[9px]">OT Sisa</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp=>{
                    const s = getSaldo(emp.id, saldoYear)
                    return(
                      <tr key={emp.id}>
                        <td className="font-semibold text-[12.5px]">{emp.full_name}</td>
                        <td className="text-[12px] text-slate-400">{emp.division}</td>
                        <td className="text-[12px] text-slate-500">{calcYoS(emp.join_date)}</td>
                        <td className="text-center font-semibold">{s.annualEntitled}</td>
                        <td className="text-center text-slate-500">{s.carryOver}</td>
                        <td className="text-center text-slate-600">{s.annualUsed}</td>
                        <td className="text-center">
                          <span className={cn('text-[13px] font-bold',s.annualLeft<=0?'text-red-600':s.annualLeft<=3?'text-amber-500':'text-teal-600')}>
                            {s.annualLeft}
                          </span>
                        </td>
                        <td className="text-center text-slate-500">{s.sickUsed}</td>
                        <td className="text-center text-slate-500">{s.specialUsed}</td>
                        <td className="text-center text-slate-600">{s.otEntitled}</td>
                        <td className="text-center text-slate-500">{s.otUsed}</td>
                        <td className="text-center">
                          <span className={cn('text-[13px] font-bold',s.otLeft>0?'text-green-600':'text-slate-300')}>{s.otLeft}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-6 flex-wrap">
              <span>📅 Hak tahunan: <strong>12 hari</strong> · Carry-over max <strong>5 hari</strong>, hangus setelah Juni</span>
              <span className="text-blue-600">🏥 Sakit & Cuti Khusus tidak mengurangi saldo tahunan</span>
              <span className="text-green-600">💪 Overtime: divalidasi HC + atasan sebelum ditambahkan</span>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Tambah/Edit Cuti ── */}
      {showLeaveModal&&(
        <Modal title={editId?'Edit Data Cuti':'Tambah Cuti Karyawan'} onClose={()=>setShowLeaveModal(false)}>
          <div className="space-y-3">
            <div><label className="form-label">Karyawan *</label>
              <select value={leaveForm.employee_id} onChange={e=>lf('employee_id',e.target.value)} className="form-input">
                <option value="">Pilih karyawan...</option>
                {employees.map(e=>{
                  const s=getSaldo(e.id,new Date().getFullYear())
                  const info = leaveForm.leave_type==='Tahunan' ? ` · sisa ${s.annualLeft} hr tahunan`
                             : leaveForm.leave_type==='Overtime' ? ` · sisa ${s.otLeft} hr OT`
                             : ''
                  return <option key={e.id} value={e.id}>{e.full_name} — {e.division}{info}</option>
                })}
              </select>
            </div>

            {/* Toggle gabung cuti */}
            <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
              <div>
                <div className="text-[12.5px] font-semibold text-slate-700">Gabung dengan cuti khusus?</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Misal: cuti ulang tahun + tahunan dalam 1 periode</div>
              </div>
              <button onClick={()=>lf('is_combined',!leaveForm.is_combined)}
                className={cn('w-11 h-6 rounded-full transition-all relative flex-shrink-0',
                  leaveForm.is_combined?'bg-teal-500':'bg-slate-300')}>
                <div className={cn('w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm',
                  leaveForm.is_combined?'left-6':'left-1')}/>
              </button>
            </div>

            {/* Mode biasa */}
            {!leaveForm.is_combined&&(
              <div><label className="form-label">Tipe Cuti</label>
                <select value={leaveForm.leave_type} onChange={e=>lf('leave_type',e.target.value)} className="form-input">
                  {LEAVE_TYPES.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
            )}

            {/* Mode gabung */}
            {leaveForm.is_combined&&(
              <div className="space-y-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="text-[12px] font-semibold text-blue-800">Rincian Cuti Gabungan</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Hari Cuti Tahunan</label>
                    <input type="number" value={leaveForm.annual_days} min={0}
                      onChange={e=>{const v=parseInt(e.target.value)||0;lf('annual_days',v);lf('total_days',v+(leaveForm.special_days||0));lf('leave_type','Tahunan')}}
                      className="form-input" placeholder="0"/>
                    {leaveForm.employee_id&&(()=>{
                      const s=getSaldo(leaveForm.employee_id,new Date().getFullYear())
                      return <div className="text-[10.5px] text-teal-600 mt-1">Sisa saldo: {s.annualLeft} hr</div>
                    })()}
                  </div>
                  <div>
                    <label className="form-label">Hari Cuti Khusus</label>
                    <input type="number" value={leaveForm.special_days} min={0}
                      onChange={e=>{const v=parseInt(e.target.value)||0;lf('special_days',v);lf('total_days',(leaveForm.annual_days||0)+v)}}
                      className="form-input" placeholder="0"/>
                  </div>
                </div>
                <div><label className="form-label">Jenis Cuti Khusus</label>
                  <select value={leaveForm.special_type} onChange={e=>lf('special_type',e.target.value)} className="form-input">
                    <option value="">Pilih...</option>
                    {SPECIAL_TYPES.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}
                  </select>
                </div>
                <div className="bg-white rounded-lg px-3 py-2.5 text-[12px] text-blue-700 border border-blue-200">
                  Total: <strong>{(leaveForm.annual_days||0)+(leaveForm.special_days||0)} hari</strong>
                  {leaveForm.annual_days>0&&<span className="ml-2">· {leaveForm.annual_days} hr potong tahunan</span>}
                  {leaveForm.special_days>0&&<span className="ml-1">· {leaveForm.special_days} hr cuti khusus (tidak potong tahunan)</span>}
                </div>
              </div>
            )}

            {leaveForm.leave_type==='Penting'&&!leaveForm.is_combined&&(
              <div><label className="form-label">Jenis Cuti Khusus</label>
                <select value={leaveForm.special_type} onChange={e=>lf('special_type',e.target.value)} className="form-input">
                  <option value="">Pilih...</option>
                  {SPECIAL_TYPES.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
            )}
            {/* Saldo info */}
            {leaveForm.employee_id&&(leaveForm.leave_type==="Tahunan"||leaveForm.is_combined)&&(()=>{
              const s=getSaldo(leaveForm.employee_id,new Date().getFullYear())
              return(
                <div className={cn('rounded-lg px-4 py-3 text-[12px]',s.annualLeft<=0?'bg-red-50 border border-red-200 text-red-700':'bg-teal-50 border border-teal-200 text-teal-700')}>
                  Saldo cuti tahunan: <strong>{s.annualLeft}</strong> hari tersisa dari {s.annualTotal} total
                  {s.carryOver>0&&<span className="text-teal-600"> (termasuk {s.carryOver} hr carry-over)</span>}
                  {s.annualLeft<leaveForm.total_days&&<div className="text-red-600 font-semibold mt-1">⚠ Saldo tidak cukup!</div>}
                </div>
              )
            })()}
            {leaveForm.leave_type==='Overtime'&&leaveForm.employee_id&&(()=>{
              const s=getSaldo(leaveForm.employee_id,new Date().getFullYear())
              return(
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-[12px] text-green-700">
                  Saldo overtime: <strong>{s.otLeft}</strong> hari tersisa dari {s.otEntitled} hak
                </div>
              )
            })()}
            {NON_ANNUAL_TYPES.includes(leaveForm.leave_type)&&leaveForm.leave_type!=="Overtime"&&!leaveForm.is_combined&&(
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-[12px] text-blue-700">
                ℹ Cuti {leaveForm.leave_type} tidak mengurangi saldo cuti tahunan
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Tanggal Mulai *</label><input type="date" value={leaveForm.start_date} onChange={e=>onDateChange('start_date',e.target.value)} className="form-input"/></div>
              <div><label className="form-label">Tanggal Selesai *</label><input type="date" value={leaveForm.end_date} onChange={e=>onDateChange('end_date',e.target.value)} className="form-input"/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Total Hari</label><input type="number" value={leaveForm.total_days} onChange={e=>lf('total_days',parseInt(e.target.value))} className="form-input" min={1}/></div>
              <div><label className="form-label">Status</label>
                <select value={leaveForm.status} onChange={e=>lf('status',e.target.value)} className="form-input">
                  <option>Approved</option><option>Pending</option><option>Rejected</option>
                </select>
              </div>
            </div>
            <div><label className="form-label">Catatan</label><input value={leaveForm.notes} onChange={e=>lf('notes',e.target.value)} className="form-input" placeholder="Opsional..."/></div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={()=>setShowLeaveModal(false)} className="btn btn-ghost">Batal</button>
              <button onClick={saveLeave} disabled={saving} className="btn btn-teal">{saving?'Menyimpan...':editId?'Update':'Simpan'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: Tambah Overtime Leave ── */}
      {showOTModal&&(<OvertimeModal employees={employees} balances={balances} onSave={saveOT} onClose={()=>setShowOTModal(false)}/>)}
    </div>
  )
}

function OvertimeModal({ employees, balances, onSave, onClose }: { employees:any[]; balances:any[]; onSave:(empId:string,days:number,note:string)=>void; onClose:()=>void }) {
  const [empId, setEmpId] = useState('')
  const [days, setDays]   = useState(1)
  const [note, setNote]   = useState('')
  const bal = balances.find(b=>b.employee_id===empId)
  return(
    <Modal title="Tambah Kompensasi Overtime Leave" onClose={onClose}>
      <div className="space-y-3">
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-[12.5px] text-green-800">
          Karyawan yang memenuhi kriteria overwork (&gt;120% SLA selama ≥3 hari berturut-turut, divalidasi atasan + HC) berhak mendapat cuti kompensasi tambahan.
        </div>
        <div><label className="form-label">Karyawan *</label>
          <select value={empId} onChange={e=>setEmpId(e.target.value)} className="form-input">
            <option value="">Pilih karyawan...</option>
            {employees.map(e=><option key={e.id} value={e.id}>{e.full_name} — {e.division}</option>)}
          </select>
        </div>
        {empId&&(
          <div className="bg-slate-50 rounded-lg px-4 py-2.5 text-[12px] text-slate-600">
            Saldo overtime saat ini: <strong className="text-green-600">{bal?.overtime_entitled??0} hari</strong>
          </div>
        )}
        <div><label className="form-label">Jumlah Hari Ditambahkan *</label>
          <input type="number" value={days} onChange={e=>setDays(Math.max(1,parseInt(e.target.value)||1))} className="form-input" min={1}/>
        </div>
        <div><label className="form-label">Keterangan / Periode Overtime</label>
          <textarea value={note} onChange={e=>setNote(e.target.value)} className="form-input h-16 resize-none" placeholder="e.g. Overtime April 2026 — project X, validasi dari manager + HC"/>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn btn-ghost">Batal</button>
          <button onClick={()=>{if(!empId)return alert('Pilih karyawan');onSave(empId,days,note)}} className="btn btn-teal">Tambah {days} Hari</button>
        </div>
      </div>
    </Modal>
  )
}
