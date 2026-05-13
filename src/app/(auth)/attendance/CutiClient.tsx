'use client'
import { useState, useMemo, useRef } from 'react'
import { Plus, ChevronLeft, ChevronRight, Bell, Trash2, Pencil, Upload, Download } from 'lucide-react'
import { KPICard, Badge, EmptyState, TemplateBtn } from '@/components/ui'
import { fmtDate, calcYoS, cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'
import * as XLSX from 'xlsx'

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const DAYS   = ['Sen','Sel','Rab','Kam','Jum','Sab','Min']

const LEAVE_TYPES = [
  { key:'Tahunan',      label:'Cuti Tahunan',      color:'bg-teal-500',    badge:'teal',   balanceKey:'annual' },
  { key:'Sakit',        label:'Sakit',              color:'bg-blue-500',    badge:'blue',   balanceKey:'sick' },
  { key:'Penting',      label:'Cuti Khusus (Penting)',        color:'bg-amber-500',   badge:'amber',  balanceKey:null },
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
function calcAnnualEntitledStub(_joinDate: string): number { return 12 }

// Carry-over max 5 hr, hangus setelah Juni
function calcCarryOver(prevRemaining: number): number {
  const now = new Date()
  if (now.getMonth() >= 6) return 0 // Juli+ = hangus
  return Math.min(prevRemaining, 5)
}

// Hitung hari kerja (Senin-Jumat) antara dua tanggal, inklusif
function calcWorkdays(startStr: string, endStr: string): number {
  if (!startStr || !endStr) return 1
  const start = new Date(startStr + 'T00:00:00')
  const end   = new Date(endStr   + 'T00:00:00')
  if (end < start) return 1
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const day = cur.getDay() // 0=Sun, 6=Sat
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return Math.max(1, count)
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
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showBalModal, setShowBalModal]     = useState(false)
  const [showOTModal, setShowOTModal]       = useState(false)
  const [editId, setEditId]     = useState<string|null>(null)
  const [saving, setSaving]     = useState(false)
  const [leaveForm, setLeaveForm] = useState<any>(EMPTY_LEAVE)
  const [saldoMsg, setSaldoMsg] = useState('')
  const saldoFileRef = useRef<HTMLInputElement>(null)
  const leaveFileRef = useRef<HTMLInputElement>(null)
  const flashSaldo = (t:string)=>{setSaldoMsg(t);setTimeout(()=>setSaldoMsg(''),4000)}

  async function importSaldo(e: React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]; if(!file)return
    flashSaldo('Membaca file...')
    try{
      const buf=await file.arrayBuffer(); const wb=XLSX.read(buf, { cellDates: true })
      const rows:any[]=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { raw: false, dateNF: 'yyyy-mm-dd' })
      const normD=(v:any)=>v instanceof Date?`${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,'0')}-${String(v.getDate()).padStart(2,'0')}`:v
      const normalizedRows=rows.map((r:any)=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,normD(v)])))
      let count=0
      for(const row of normalizedRows){
        const empName=row['Nama']||''
        const emp=employees.find((ex:any)=>ex.full_name.toLowerCase()===empName.toLowerCase())
        if(!emp) continue
        const payload={employee_id:emp.id,year:parseInt(row['Tahun'])||saldoYear,annual_entitled:parseInt(row['Hak Tahunan'])||12,annual_carryover:Math.min(parseInt(row['Carry-over'])||0,5),annual_used:parseInt(row['Terpakai'])||0,overtime_entitled:parseInt(row['Hak OT'])||0,overtime_used:parseInt(row['OT Terpakai'])||0,notes:row['Catatan']||''}
        const res=await fetch('/api/leave-balance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
        const data=await res.json()
        if(res.ok&&data.data){
          setBalances((prev:any[])=>{
            const exists=prev.find((b:any)=>b.employee_id===emp.id&&b.year===payload.year)
            if(exists) return prev.map((b:any)=>b.employee_id===emp.id&&b.year===payload.year?{...data.data,employee:emp}:b)
            return [{...data.data,employee:emp},...prev]
          })
          count++
        }
      }
      flashSaldo(`✓ ${count} data saldo berhasil diimport`)
    }catch(err:any){flashSaldo(`✗ Error: ${err.message}`)}
    if(saldoFileRef.current) saldoFileRef.current.value=''
  }

  function exportSaldo(){
    const rows=employees.map(emp=>{
      const s=getSaldo(emp.id,saldoYear)
      return {'Nama':emp.full_name,'Divisi':emp.division,'Masa Kerja':calcYoS(emp.join_date),'Tahun':saldoYear,'Hak Tahunan':s.annualEntitled,'Carry-over':s.carryOver,'Terpakai':s.annualUsed,'Sisa Tahunan':s.annualLeft,'Sakit':s.sickUsed,'Khusus':s.specialUsed,'Hak OT':s.otEntitled,'OT Terpakai':s.otUsed,'OT Sisa':s.otLeft}
    })
    const ws=XLSX.utils.json_to_sheet(rows);const wb=XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb,ws,'Saldo Cuti')
    XLSX.writeFile(wb,`saldo-cuti-${saldoYear}.xlsx`)
    flashSaldo('✓ Export berhasil')
  }
  const [balForm, setBalForm]     = useState<any>(EMPTY_BAL)
  const [activeTab, setActiveTab] = useState<'calendar'|'saldo'>('calendar')
  const [calFilterYear, setCalFilterYear] = useState(today.getFullYear())
  const [saldoYear, setSaldoYear] = useState(2026)

  // Filter leave by selected year untuk kalender & tabel
  const leaveByYear = leave.filter(l => {
    const y = l.start_date ? parseInt(l.start_date.slice(0,4)) : 0
    return y === calFilterYear
  })
  const lf = (k:string,v:any) => setLeaveForm((p:any)=>({...p,[k]:v}))
  const bf = (k:string,v:any) => setBalForm((p:any)=>({...p,[k]:v}))

  // ── Helpers ──────────────────────────────────────────────
  // Auto-calculate saldo tanpa perlu init manual
  function calcAnnualEntitled(joinDate: string, year: number): number {
    if (!joinDate) return 12
    const join      = new Date(joinDate + 'T00:00:00')
    const joinYear  = join.getFullYear()
    const joinMonth = join.getMonth() // 0-based
    const joinQ     = Math.floor(joinMonth / 3) + 1 // Q1=1..Q4=4

    // Belum join tahun ini
    if (joinYear > year) return 0

    // Tahun join → prorata: 1 hari per bulan aktif (dari bulan join sampai Desember)
    if (joinYear === year) return 12 - joinMonth

    const yearsAfter = year - joinYear

    if (yearsAfter === 1) {
      // Join Q1 → langsung full 12 di tahun berikutnya
      if (joinQ === 1) return 12
      // Join Q2/Q3/Q4 → masih prorata di tahun+1: sisa bulan menuju 1 tahun penuh
      // Contoh: join April(3) → dapat 9 bln di 2025, sisa 3 bln (Jan-Mar) di 2026
      return joinMonth // April=3, Nov=10, dst
    }

    // 2+ tahun setelah join → full 12
    return 12
  }
  function getSaldo(empId:string, year:number=2026) {
    const emp = employees.find(e=>e.id===empId)
    const bal = balances.find(b=>b.employee_id===empId&&b.year===year)

    // Hak tahunan — dihitung otomatis dari join_date, bisa di-override manual via bal
    const autoEntitled = calcAnnualEntitled(emp?.join_date || '', year)
    const annualEntitled = bal?.annual_entitled != null ? bal.annual_entitled : autoEntitled

    // Carry-over: cek balance tahun lalu, max 5hr, hangus setelah Juni
    const prevBal = balances.find(b=>b.employee_id===empId&&b.year===year-1)
    const prevAutoEntitled = calcAnnualEntitled(emp?.join_date || '', year-1)
    const prevEntitled = prevBal?.annual_entitled != null ? prevBal.annual_entitled : prevAutoEntitled
    const prevAnnualUsed = (prevBal?.annual_used != null)
      ? prevBal.annual_used
      : leave.filter(l=>l.employee_id===empId&&l.leave_type==='Tahunan'&&l.status==='Approved'&&new Date(l.start_date+'T00:00:00').getFullYear()===year-1).reduce((s,l)=>s+l.total_days,0)
    const prevCarryOver = prevBal?.annual_carryover ?? 0
    const prevRemaining = (prevEntitled + prevCarryOver) - prevAnnualUsed

    // Kalau bal.annual_carryover sudah diisi manual (> 0), pakai nilai itu
    // Kalau 0 atau tidak ada, hitung otomatis dari sisa tahun lalu
    const carryOver = (bal?.annual_carryover != null && bal.annual_carryover > 0)
      ? bal.annual_carryover
      : calcCarryOver(prevRemaining)

    // Hanya cuti Tahunan yang ngurangi saldo
    const annualUsed = leave.filter(l=>l.employee_id===empId&&l.leave_type==='Tahunan'&&l.status==='Approved'&&new Date(l.start_date+'T00:00:00').getFullYear()===year).reduce((s,l)=>s+l.total_days,0)
    const annualTotal = annualEntitled + carryOver
    const annualLeft  = annualTotal - annualUsed

    // Cuti khusus (tidak ngurangi tahunan)
    const sickUsed    = leave.filter(l=>l.employee_id===empId&&l.leave_type==='Sakit'&&l.status==='Approved'&&new Date(l.start_date+'T00:00:00').getFullYear()===year).reduce((s,l)=>s+l.total_days,0)
    const specialUsed = leave.filter(l=>l.employee_id===empId&&l.leave_type==='Penting'&&l.status==='Approved'&&new Date(l.start_date+'T00:00:00').getFullYear()===year).reduce((s,l)=>s+l.total_days,0)
    const otUsed      = leave.filter(l=>l.employee_id===empId&&l.leave_type==='Overtime'&&l.status==='Approved'&&new Date(l.start_date+'T00:00:00').getFullYear()===year).reduce((s,l)=>s+l.total_days,0)

    // OT hangus 30 hari setelah ot_granted_at
    const otGrantedAt = bal?.ot_granted_at
    const otExpired   = otGrantedAt
      ? (Date.now() - new Date(otGrantedAt).getTime()) > 30 * 24 * 60 * 60 * 1000
      : false
    const otEntitledActive = otExpired ? 0 : (bal?.overtime_entitled ?? 0)
    const otExpiryDate = otGrantedAt
      ? new Date(new Date(otGrantedAt).getTime() + 30 * 24 * 60 * 60 * 1000)
      : null

    return { annualEntitled, carryOver, annualTotal, annualUsed, annualLeft, sickUsed, specialUsed,
      otEntitled: otEntitledActive, otUsed, otLeft: otEntitledActive - otUsed,
      otExpired, otExpiryDate, otGrantedAt }
  }

  // ── Calendar ─────────────────────────────────────────────
  const leaveThisMonth = useMemo(()=>leaveByYear.filter(l=>{
    const s=new Date(l.start_date+'T00:00:00')
    const e=new Date(l.end_date+'T00:00:00')
    const ms=new Date(calY,calM,1)
    const me=new Date(calY,calM+1,0)
    return s<=me&&e>=ms&&l.status==='Approved'
  }),[leaveByYear,calY,calM])

  const dayMap = useMemo(()=>{
    const map:Record<string,any[]>={}
    leaveThisMonth.forEach(l=>{
      const s=new Date(l.start_date+'T00:00:00')
      const e=new Date(l.end_date+'T00:00:00')
      for(let d=new Date(s);d<=e;d.setDate(d.getDate()+1)){
        const day = d.getDay()
        if(day===0||day===6) continue // skip Sabtu & Minggu
        const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        if(!map[key])map[key]=[]
        map[key].push(l)
      }
    })
    return map
  },[leaveThisMonth])

  const upcoming = useMemo(()=>{
    const now=new Date();now.setHours(0,0,0,0)
    const in7=new Date(now.getTime()+7*86400000)
    return leaveByYear.filter(l=>{const s=new Date(l.start_date+'T00:00:00');s.setHours(0,0,0,0);return s>=now&&s<=in7&&l.status==='Approved'})
      .sort((a,b)=>new Date(a.start_date).getTime()-new Date(b.start_date).getTime())
  },[leaveByYear])

  const firstDay=new Date(calY,calM,1).getDay()
  const offset=firstDay===0?6:firstDay-1
  const daysInMonth=new Date(calY,calM+1,0).getDate()
  const todayStr=today.toISOString().slice(0,10)
  function prevMonth(){if(calM===0){setCalM(11);setCalY(y=>y-1)}else setCalM(m=>m-1);setSelected(null)}
  function nextMonth(){if(calM===11){setCalM(0);setCalY(y=>y+1)}else setCalM(m=>m+1);setSelected(null)}

  // ── CRUD Leave ───────────────────────────────────────────

  // Issue #4: auto-generate end_date dari start_date + total_days
  function calcEndDate(startStr: string, days: number): string {
    if (!startStr || days < 1) return startStr
    const d = new Date(startStr + 'T00:00:00')
    // Hari pertama (start_date) = hari ke-1, loop tambah sisanya
    let counted = 1
    while (counted < days) {
      d.setDate(d.getDate() + 1)
      const day = d.getDay() // 0=Sun, 6=Sat
      if (day !== 0 && day !== 6) counted++
    }
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  }

  function onDateChange(field: 'start_date'|'end_date', val: string){
    const next = {...leaveForm, [field]: val}

    if (next.is_combined) {
      // Mode gabungan: end_date selalu auto dari start_date + total_days
      // Hanya start_date yang bisa diubah user
      if (field === 'start_date' && next.start_date) {
        const total = (next.annual_days||0) + (next.special_days||0)
        if (total > 0) {
          next.end_date = calcEndDate(next.start_date, total)
          next.total_days = total
        }
      }
      // end_date di combined mode diabaikan (auto-generated)
    } else {
      // Mode biasa: hitung workdays dari range tanggal
      if (next.start_date && next.end_date && next.end_date < next.start_date) {
        next.end_date = next.start_date
      }
      if (next.start_date && next.end_date) {
        next.total_days = calcWorkdays(next.start_date, next.end_date)
      }
    }
    setLeaveForm(next)
  }

  // Issue #4: saat total_days diubah manual → auto update end_date
  function onTotalDaysChange(days: number) {
    const next = {...leaveForm, total_days: days}
    if (next.start_date && days > 0) {
      next.end_date = calcEndDate(next.start_date, days)
    }
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

  // Refetch semua data cuti dari API — pastikan tanggal dan employee join benar
  async function refetchLeave() {
    // cache: 'no-store' supaya tidak pakai cached response dari browser
    const res = await fetch('/api/leave', { cache: 'no-store' })
    const data = await res.json()
    if (data.data) setLeave(data.data)
  }

  async function saveLeave(){
    if(!leaveForm.employee_id||!leaveForm.start_date||!leaveForm.end_date){alert('Pilih karyawan dan tanggal');return}

    // Validasi masa tunggu (hanya untuk cuti Tahunan, bukan edit)
    if(!editId && leaveForm.leave_type==='Tahunan'){
      const emp = employees.find(e=>e.id===leaveForm.employee_id)
      if(emp?.join_date){
        const join     = new Date(emp.join_date+'T00:00:00')
        const start    = new Date(leaveForm.start_date+'T00:00:00')
        const months   = (start.getFullYear()-join.getFullYear())*12+(start.getMonth()-join.getMonth())
        const minMonths = emp.employment_type==='PKWTT' ? 3 : 6
        if(months < minMonths){
          alert(`Karyawan ini belum memenuhi masa tunggu.\n${emp.employment_type==='PKWTT'?'PKWTT':'PKWT'} minimal ${minMonths} bulan kerja sebelum dapat menggunakan cuti tahunan.\nMasa kerja saat ini: ${months} bulan.`)
          return
        }
      }
    }

    // Validasi saldo OT — cek dulu sebelum save
    if(!leaveForm.is_combined && leaveForm.leave_type==='Overtime'){
      const s = getSaldo(leaveForm.employee_id, new Date(leaveForm.start_date+'T00:00:00').getFullYear())
      if(s.otLeft <= 0){
        alert(`Saldo Overtime Leave ${leaveForm.employee_id} sudah habis (Hak OT: ${s.otEntitled}, Terpakai: ${s.otUsed}).\n\nTambah Hak OT dulu di tab Saldo Cuti → Edit → Hak OT.`)
        return
      }
      if(leaveForm.total_days > s.otLeft){
        alert(`Saldo OT tidak cukup. Sisa: ${s.otLeft} hari, diminta: ${leaveForm.total_days} hari.`)
        return
      }
    }
    setSaving(true)
    try{
      const year=new Date(leaveForm.start_date+'T00:00:00').getFullYear()

      // Cek duplikat — skip kalau sudah ada record yang sama (bukan edit)
      const isDupe = (type: string) => !editId && leave.some(l =>
        l.employee_id===leaveForm.employee_id &&
        l.leave_type===type &&
        l.start_date===leaveForm.start_date
      )

      if(leaveForm.is_combined){
        if(leaveForm.annual_days>0 && !isDupe('Tahunan')){
          const r1={employee_id:leaveForm.employee_id,leave_type:'Tahunan',start_date:leaveForm.start_date,end_date:leaveForm.end_date,total_days:leaveForm.annual_days,status:leaveForm.status,notes:`[Gabungan] ${leaveForm.notes||''}`.trim(),year}
          const res=await fetch('/api/leave',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(r1)})
          const data=await res.json();if(!res.ok)throw new Error(data.error)
        }
        if(leaveForm.special_days>0 && !isDupe('Penting')){
          const r2={employee_id:leaveForm.employee_id,leave_type:'Penting',special_type:leaveForm.special_type,start_date:leaveForm.start_date,end_date:leaveForm.end_date,total_days:leaveForm.special_days,status:leaveForm.status,notes:`[Gabungan - Khusus] ${leaveForm.notes||''}`.trim(),year}
          const res=await fetch('/api/leave',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(r2)})
          const data=await res.json();if(!res.ok)throw new Error(data.error)
        }
        await updateBalanceUsed(leaveForm.employee_id,'annual')
      } else {
        const payload={...leaveForm,year}
        if(editId){
          const res=await fetch('/api/leave',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editId,...payload})})
          const data=await res.json();if(!res.ok)throw new Error(data.error)
        }else if(!isDupe(leaveForm.leave_type)){
          const res=await fetch('/api/leave',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
          const data=await res.json();if(!res.ok)throw new Error(data.error)
        }
        if(leaveForm.leave_type==='Tahunan') await updateBalanceUsed(leaveForm.employee_id,'annual')
        if(leaveForm.leave_type==='Overtime') await updateBalanceUsed(leaveForm.employee_id,'overtime')
      }

      // Refetch data dari API — pastikan tanggal dan employee join benar, tidak ada duplikat di state
      await refetchLeave()
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
    await refetchLeave()
    setCheckedIds(prev=>{ const n=new Set(prev); n.delete(id); return n })
  }

  async function bulkDelete(){
    if(checkedIds.size===0) return
    if(!confirm(`Hapus ${checkedIds.size} data cuti yang dipilih?`)) return
    setBulkDeleting(true)
    await Promise.all([...checkedIds].map(id=>fetch(`/api/leave?id=${id}`,{method:'DELETE'})))
    setCheckedIds(new Set())
    await refetchLeave()
    setBulkDeleting(false)
  }

  function toggleCheck(id: string) {
    setCheckedIds(prev=>{
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  function toggleAll(ids: string[]) {
    const allChecked = ids.every(id=>checkedIds.has(id))
    setCheckedIds(prev=>{
      const n = new Set(prev)
      if(allChecked) ids.forEach(id=>n.delete(id))
      else ids.forEach(id=>n.add(id))
      return n
    })
  }

  // ── Init balance for employee ─────────────────────────────
  async function initBalance(empId:string){
    const emp=employees.find(e=>e.id===empId)
    const entitled=calcAnnualEntitled(emp?.join_date||'', saldoYear)
    const payload={employee_id:empId,year:saldoYear,annual_entitled:entitled,annual_carryover:0,annual_used:0,overtime_entitled:0,overtime_used:0,sick_used:0}
    const res=await fetch('/api/leave-balance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
    const data=await res.json()
    if(res.ok&&data.data){setBalances(prev=>[{...data.data,employee:emp},...prev])}
  }

  // ── Save balance (init/edit) ──────────────────────────────
  async function saveBalance(){
    if(!balForm.employee_id){alert('Pilih karyawan');return}
    setSaving(true)
    try{
      const existing = balances.find(b=>b.employee_id===balForm.employee_id&&b.year===balForm.year)
      const method = existing ? 'PATCH' : 'POST'
      const payload = existing ? {id: existing.id, ...balForm} : balForm
      const res=await fetch('/api/leave-balance',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      const data=await res.json();if(!res.ok)throw new Error(data.error)
      const emp=employees.find(e=>e.id===balForm.employee_id)
      setBalances(prev=>{
        const exists=prev.find(b=>b.employee_id===balForm.employee_id&&b.year===balForm.year)
        if(exists)return prev.map(b=>b.employee_id===balForm.employee_id&&b.year===balForm.year?{...data.data,employee:emp}:b)
        return [{...data.data,employee:emp},...prev]
      })
      setShowBalModal(false)
    }catch(err:any){alert('Error: '+err.message)}
    setSaving(false)
  }

  // ── Save overtime addition ────────────────────────────────
  async function saveOT(empId:string, addDays:number, note:string){
    const bal=balances.find(b=>b.employee_id===empId&&b.year===saldoYear)
    const current=bal?.overtime_entitled??0
    const payload:any={employee_id:empId,year:saldoYear,overtime_entitled:current+addDays,notes:note}

    setSaving(true)
    try {
      let res, data
      if(bal?.id){
        res=await fetch('/api/leave-balance',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:bal.id,...payload})})
      } else {
        res=await fetch('/api/leave-balance',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,annual_entitled:12,annual_carryover:0,annual_used:0})})
      }
      data=await res.json()
      if(!res.ok) throw new Error(data?.error||'Gagal menyimpan')
      if(data.data){
        const emp=employees.find(e=>e.id===empId)
        setBalances(prev=>{
          const exists=prev.find(b=>b.employee_id===empId&&b.year===saldoYear)
          if(exists) return prev.map(b=>b.employee_id===empId&&b.year===saldoYear?{...data.data,employee:emp}:b)
          return [{...data.data,employee:emp},...prev]
        })
        flashSaldo(`✓ OT +${addDays} hari berhasil ditambahkan`)
      }
      setShowOTModal(false)
    } catch(err:any) {
      alert('Gagal menyimpan OT: '+err.message)
    } finally {
      setSaving(false)
    }
  }

  const selectedLeave = selected?(dayMap[selected]??[]):[]
  const typeColorMap = LEAVE_TYPES.reduce((a,t)=>({...a,[t.key]:t.color}),{} as Record<string,string>)
  const typeBadgeMap = LEAVE_TYPES.reduce((a,t)=>({...a,[t.key]:t.badge}),{} as Record<string,string>)

  return(
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card p-4 flex items-center gap-3"><div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-red-500 font-bold text-lg">{leave.filter(l=>{const s=new Date(l.start_date+'T00:00:00'),e=new Date(l.end_date+'T00:00:00');return today>=s&&today<=e&&l.status==='Approved'}).length}</div><div><div className="text-[13px] font-semibold">Cuti Hari Ini</div><div className="text-[11.5px] text-slate-400 mt-0.5">sedang cuti</div></div></div>
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
          {/* Year filter */}
          <div className="flex items-center gap-2">
            {[2026,2025,2024].map(y=>(
              <button key={y} onClick={()=>{setCalFilterYear(y);setCalY(y)}}
                className={cn('px-3.5 py-1.5 rounded-lg text-[12px] font-semibold border transition-all',
                  calFilterYear===y?'bg-[#0f1e3d] text-white border-[#0f1e3d]':'bg-white text-slate-500 border-slate-200 hover:border-slate-400')}>
                {y}
              </button>
            ))}
            <span className="text-[11.5px] text-slate-400 ml-1">
              {leaveByYear.length} data cuti {calFilterYear}
            </span>
          </div>
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
                  {DAYS.map((d,i)=><div key={d} className={cn('text-center text-[10px] font-semibold py-1',i>=5?'text-slate-300':'text-slate-400')}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({length:offset}).map((_,i)=><div key={`e${i}`}/>)}
                  {Array.from({length:daysInMonth}).map((_,i)=>{
                    const day=i+1
                    const dateStr=`${calY}-${String(calM+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                    const isToday=dateStr===todayStr
                    const isSel=dateStr===selected
                    const dayLeave=dayMap[dateStr]??[]
                    // Hitung hari dalam minggu: offset adalah firstDay (0=Sen di grid kita)
                    const colIndex=(offset+i)%7 // 0=Sen ... 5=Sab, 6=Min
                    const isWeekend=colIndex>=5
                    return(
                      <div key={day} onClick={()=>!isWeekend&&setSelected(isSel?null:dateStr)}
                        className={cn('rounded-xl p-1.5 transition-all min-h-[56px] flex flex-col',
                          isWeekend?'bg-slate-50/60 cursor-default opacity-50':
                          isToday?'bg-[#0f1e3d] text-white cursor-pointer':
                          isSel?'bg-teal-50 border-2 border-teal-400 cursor-pointer':
                          dayLeave.length>0?'bg-slate-50 hover:bg-slate-100 cursor-pointer':'hover:bg-slate-50 cursor-pointer'
                        )}>
                        <div className={cn('text-[12px] font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-0.5',isToday?'bg-white text-[#0f1e3d]':isWeekend?'text-slate-300':'text-slate-700')}>{day}</div>
                        {!isWeekend&&(
                          <div className="flex flex-col gap-0.5 overflow-hidden">
                            {dayLeave.slice(0,2).map((l,idx)=>(
                              <div key={idx} className={cn('text-[8px] font-semibold text-white rounded px-1 truncate',typeColorMap[l.leave_type]??'bg-gray-400')}>
                                {l.employee?.full_name?.split(' ')[0]}
                              </div>
                            ))}
                            {dayLeave.length>2&&<div className="text-[8px] text-slate-400">+{dayLeave.length-2}</div>}
                          </div>
                        )}
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
              <div className="flex items-center gap-3">
                <span className="card-title">Semua Data Cuti</span>
                {checkedIds.size>0&&(
                  <button onClick={bulkDelete} disabled={bulkDeleting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-[11.5px] font-semibold hover:bg-red-100 transition-colors">
                    <Trash2 size={12}/>
                    {bulkDeleting?'Menghapus...':`Hapus ${checkedIds.size} data`}
                  </button>
                )}
              </div>
              <button onClick={()=>openAdd()} className="btn btn-teal btn-sm"><Plus size={12}/> Tambah</button>
            </div>
            <table className="tbl">
              <thead><tr>
                <th className="w-8 text-center">
                  <input type="checkbox"
                    className="w-3.5 h-3.5 rounded accent-teal-500 cursor-pointer"
                    checked={leave.length>0&&leaveByYear.every(l=>checkedIds.has(l.id))}
                    onChange={()=>toggleAll(leaveByYear.map(l=>l.id))}/>
                </th>
                <th>Karyawan</th><th>Divisi</th><th>Tipe</th>
                <th>Mulai</th><th>Selesai</th><th>Total Hari</th>
                <th>Status</th><th>Catatan / Link Drive</th>
                <th className="text-center">Aksi</th>
              </tr></thead>
              <tbody>
                {(() => {
                  // Grup Tahunan + Khusus yang employee & tanggal mulai sama → 1 baris
                  const grouped: any[] = []
                  const usedIds = new Set<string>()

                  // Sort: Tahunan dulu supaya jadi primary row
                  const sorted = [...leaveByYear].sort((a,b)=>{
                    if(a.leave_type==='Tahunan'&&b.leave_type!=='Tahunan') return -1
                    if(a.leave_type!=='Tahunan'&&b.leave_type==='Tahunan') return 1
                    return 0
                  })

                  sorted.forEach(l => {
                    if (usedIds.has(l.id)) return
                    // Cari pasangan: same employee, same start_date, Tahunan + Penting
                    if (l.leave_type === 'Tahunan') {
                      const pair = sorted.find(l2 =>
                        !usedIds.has(l2.id) &&
                        l2.id !== l.id &&
                        l2.employee_id === l.employee_id &&
                        l2.start_date === l.start_date &&
                        l2.leave_type === 'Penting'
                      )
                      if (pair) {
                        usedIds.add(l.id)
                        usedIds.add(pair.id)
                        grouped.push({ ...l, _pair: pair, _combined: true })
                        return
                      }
                    }
                    usedIds.add(l.id)
                    grouped.push(l)
                  })

                  return grouped.map(l => {
                    const tipeLabel = l.leave_type === 'Penting'
                      ? (l.special_type ? `Khusus — ${l.special_type}` : 'Khusus')
                      : l.leave_type

                    const badgeVariant = (typeBadgeMap[l.leave_type] ?? 'gray') as any

                    // Catatan: strip prefix [Gabungan] dan [Gabungan - Khusus]
                    const cleanNote = (n: string) => (n||'').replace(/^\[Gabungan.*?\]\s*/,'').trim()
                    const noteText = cleanNote(l.notes || '')

                    return (
                      <tr key={l.id} className={cn(checkedIds.has(l.id)?'bg-blue-50/50':'')}>
                        <td className="text-center">
                          <input type="checkbox"
                            className="w-3.5 h-3.5 rounded accent-teal-500 cursor-pointer"
                            checked={checkedIds.has(l.id)}
                            onChange={()=>toggleCheck(l.id)}/>
                        </td>
                        <td className="font-semibold">{l.employee?.full_name}</td>
                        <td className="text-[12px] text-slate-400">{l.employee?.division}</td>
                        <td>
                          {l._combined ? (
                            <div className="flex flex-col gap-1">
                              <Badge variant="teal">{l.total_days} hr Tahunan</Badge>
                              <Badge variant="amber">
                                {l._pair.special_type ? `${l._pair.special_type}` : 'Khusus'} ({l._pair.total_days} hr)
                              </Badge>
                            </div>
                          ) : (
                            <Badge variant={badgeVariant}>{tipeLabel}</Badge>
                          )}
                        </td>
                        <td className="text-[12px] text-slate-400">{fmtDate(l.start_date)}</td>
                        <td className="text-[12px] text-slate-400">{fmtDate(l.end_date)}</td>
                        <td className="font-semibold">
                          {l._combined
                            ? `${l.total_days + l._pair.total_days} hari`
                            : `${l.total_days} hari`}
                        </td>
                        <td><Badge variant={l.status==='Approved'?'teal':l.status==='Rejected'?'red':'amber'}>{l.status}</Badge></td>
                        <td className="max-w-[200px]">
                          {noteText ? (
                            noteText.startsWith('http') ? (
                              <a href={noteText} target="_blank" rel="noopener noreferrer"
                                className="text-[11.5px] text-blue-600 hover:underline truncate block">
                                🔗 Buka link
                              </a>
                            ) : (
                              <span className="text-[11.5px] text-slate-500 line-clamp-2">{noteText}</span>
                            )
                          ) : (
                            <span className="text-[11px] text-slate-300">–</span>
                          )}
                        </td>
                        <td><div className="flex items-center justify-center gap-1">
                          <button onClick={()=>openEdit(l)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400"><Pencil size={12}/></button>
                          <button onClick={()=>delLeave(l.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-500 text-slate-400"><Trash2 size={12}/></button>
                        </div></td>
                      </tr>
                    )
                  })
                })()}
                {leaveByYear.length===0&&<EmptyState message="Belum ada data cuti"/>}
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
              <button onClick={exportSaldo} className="btn btn-ghost btn-sm"><Download size={12}/> Export</button>
              <input ref={saldoFileRef} type="file" accept=".xlsx,.xls" onChange={importSaldo} className="hidden"/>
              <TemplateBtn sheet="Saldo Cuti"/>
              <button onClick={()=>saldoFileRef.current?.click()} className="btn btn-ghost btn-sm"><Upload size={12}/> Import</button>
              {saldoMsg&&<span className={cn('text-[11px] font-medium',saldoMsg.startsWith('✓')?'text-teal-600':'text-red-500')}>{saldoMsg}</span>}
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
                    <th rowSpan={2} className="text-center bg-amber-50 text-[9px]">Catatan OT</th>
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
                    <th className="text-center text-[9px]">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp=>{
                    const s = getSaldo(emp.id, saldoYear)
                    const bal = balances.find(b=>b.employee_id===emp.id&&b.year===saldoYear)
                    return(
                      <tr key={emp.id}>
                        <td className="font-semibold text-[12.5px]">{emp.full_name}</td>
                        <td className="text-[12px] text-slate-400">{emp.division}</td>
                        <td className="text-[12px] text-slate-500">{calcYoS(emp.join_date)}</td>
                        <td className="text-center font-semibold">
                          <div>{s.annualEntitled}</div>
                          {(()=>{
                            const auto = calcAnnualEntitled(emp.join_date||'', saldoYear)
                            const isOverride = bal?.annual_entitled != null && bal.annual_entitled !== auto
                            if(isOverride) return <div className="text-[9px] text-blue-400">override</div>
                            if(auto < 12){
                              const join = emp.join_date ? new Date(emp.join_date+'T00:00:00') : null
                              const joinQ = join ? Math.floor(join.getMonth()/3)+1 : null
                              return <div className="text-[9px] text-amber-500">prorata Q{joinQ}</div>
                            }
                            return null
                          })()}
                        </td>
                        <td className="text-center text-slate-500">{s.carryOver}</td>
                        <td className="text-center text-slate-600">{s.annualUsed}</td>
                        <td className="text-center">
                          <span className={cn('text-[13px] font-bold',s.annualLeft<=0?'text-red-600':s.annualLeft<=3?'text-amber-500':'text-teal-600')}>
                            {s.annualLeft}
                          </span>
                        </td>
                        <td className="text-center text-slate-500">{s.sickUsed}</td>
                        <td className="text-center text-slate-500">{s.specialUsed}</td>
                        <td className="text-center">
                          {s.otExpired
                            ? <span className="text-[11px] text-slate-300 italic">Hangus</span>
                            : <div>
                                <div className="text-slate-600">{s.otEntitled}</div>
                                {s.otExpiryDate && s.otEntitled > 0 && (
                                  <div className="text-[9.5px] text-amber-500">
                                    Hangus {s.otExpiryDate.getDate()}/{s.otExpiryDate.getMonth()+1}
                                  </div>
                                )}
                              </div>
                          }
                        </td>
                        <td className="text-center text-slate-500">{s.otUsed}</td>
                        <td className="text-center">
                          <span className={cn('text-[13px] font-bold',s.otLeft>0?'text-green-600':'text-slate-300')}>{s.otLeft}</span>
                        </td>
                        <td className="text-[10.5px] max-w-[120px]">
                          {s.otGrantedAt && (bal?.overtime_entitled ?? 0) > 0 ? (
                            s.otExpired
                              ? <span className="text-slate-400 italic">OT hangus {s.otExpiryDate ? `${s.otExpiryDate.getDate()}/${s.otExpiryDate.getMonth()+1}/${s.otExpiryDate.getFullYear()}` : ''}</span>
                              : <span className="text-amber-600">Berlaku s/d {s.otExpiryDate ? `${s.otExpiryDate.getDate()}/${s.otExpiryDate.getMonth()+1}/${s.otExpiryDate.getFullYear()}` : ''}</span>
                          ) : (
                            <span className="text-slate-300">–</span>
                          )}
                          {bal?.notes ? <div className="text-slate-400 mt-0.5">{bal.notes}</div> : null}
                        </td>
                        <td className="text-center">
                          <button onClick={()=>{
                            setBalForm({
                              employee_id: emp.id,
                              year: saldoYear,
                              annual_entitled: bal?.annual_entitled ?? 12,
                              annual_carryover: bal?.annual_carryover ?? s.carryOver,
                              overtime_entitled: bal?.overtime_entitled ?? 0,
                              notes: bal?.notes ?? '',
                            })
                            setShowBalModal(true)
                          }} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400 mx-auto">
                            <Pencil size={12}/>
                          </button>
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
                    <input type="number"
                      value={leaveForm.annual_days===0?'':leaveForm.annual_days}
                      min={0}
                      onChange={e=>{
                        const v=parseInt(e.target.value)||0
                        const total=v+(leaveForm.special_days||0)
                        setLeaveForm((p:any)=>({...p,
                          annual_days:v,
                          total_days:total,
                          leave_type:'Tahunan',
                          end_date: p.start_date && total>0 ? calcEndDate(p.start_date, total) : p.end_date
                        }))
                      }}
                      className="form-input" placeholder="Jumlah hari"/>
                    {leaveForm.employee_id&&(()=>{
                      const s=getSaldo(leaveForm.employee_id,new Date().getFullYear())
                      return <div className="text-[10.5px] text-teal-600 mt-1">Sisa saldo: {s.annualLeft} hr</div>
                    })()}
                  </div>
                  <div>
                    <label className="form-label">Hari Cuti Khusus</label>
                    {/* Issue #3: max sesuai saldo SPECIAL_TYPES */}
                    {leaveForm.special_type&&(()=>{
                      const st=SPECIAL_TYPES.find(t=>t.key===leaveForm.special_type)
                      const maxDays=st?.entitled??99
                      return(
                        <input type="number"
                          value={leaveForm.special_days===0?'':leaveForm.special_days}
                          min={0} max={maxDays}
                          onChange={e=>{
                            const v=Math.min(parseInt(e.target.value)||0,maxDays)
                            const total=(leaveForm.annual_days||0)+v
                            setLeaveForm((p:any)=>({...p,special_days:v,total_days:total,
                              end_date: p.start_date ? calcEndDate(p.start_date, total) : p.end_date
                            }))
                          }}
                          className="form-input" placeholder={`Maks ${maxDays} hr`}/>
                      )
                    })()}
                    {!leaveForm.special_type&&(
                      <input type="number"
                        value={leaveForm.special_days===0?'':leaveForm.special_days}
                        min={0}
                        onChange={e=>{
                          const v=parseInt(e.target.value)||0
                          const total=(leaveForm.annual_days||0)+v
                          setLeaveForm((p:any)=>({...p,special_days:v,total_days:total,
                            end_date: p.start_date ? calcEndDate(p.start_date, total) : p.end_date
                          }))
                        }}
                        className="form-input" placeholder="Pilih jenis dulu"/>
                    )}
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
              <div>
                <label className="form-label">
                  Tanggal Selesai *
                  {leaveForm.is_combined&&<span className="ml-1 text-[10px] text-teal-600 font-normal">(auto)</span>}
                </label>
                <input type="date" value={leaveForm.end_date}
                  onChange={e=>onDateChange('end_date',e.target.value)}
                  readOnly={leaveForm.is_combined}
                  className={cn('form-input',leaveForm.is_combined?'bg-slate-50 text-slate-500 cursor-not-allowed':'')}/>
              </div>
            </div>
            {leaveForm.start_date&&leaveForm.end_date&&(
              <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-2.5 text-[12px]">
                <span className="text-slate-500">Hari kerja (Sen–Jum):</span>
                <span className="font-bold text-[#0f1e3d]">{calcWorkdays(leaveForm.start_date, leaveForm.end_date)} hari</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-400">Total kalender: {Math.round((new Date(leaveForm.end_date).getTime()-new Date(leaveForm.start_date).getTime())/86400000)+1} hari</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Total Hari</label><input type="number" value={leaveForm.total_days} onChange={e=>onTotalDaysChange(parseInt(e.target.value)||1)} className="form-input" min={1}/></div>
              <div><label className="form-label">Status</label>
                <select value={leaveForm.status} onChange={e=>lf('status',e.target.value)} className="form-input">
                  <option>Approved</option><option>Pending</option><option>Rejected</option>
                </select>
              </div>
            </div>
            <div><label className="form-label">Catatan / Link Drive</label><input value={leaveForm.notes} onChange={e=>lf('notes',e.target.value)} className="form-input" placeholder="Link Google Drive handover atau catatan lain..."/></div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={()=>setShowLeaveModal(false)} className="btn btn-ghost">Batal</button>
              <button onClick={saveLeave} disabled={saving} className="btn btn-teal">{saving?'Menyimpan...':editId?'Update':'Simpan'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: Tambah Overtime Leave ── */}
      {showOTModal&&(<OvertimeModal employees={employees} balances={balances} onSave={saveOT} onClose={()=>setShowOTModal(false)} saving={saving}/>)}

      {/* ── MODAL: Edit Saldo Cuti ── */}
      {showBalModal&&(
        <Modal title="Edit Saldo Cuti" onClose={()=>setShowBalModal(false)}>
          <div className="space-y-4">
            {/* Nama karyawan */}
            <div className="bg-slate-50 rounded-xl px-4 py-3">
              <div className="text-[12px] font-semibold text-slate-700">
                {employees.find(e=>e.id===balForm.employee_id)?.full_name}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {employees.find(e=>e.id===balForm.employee_id)?.division} · {balForm.year}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Hak Tahunan</label>
                <input type="number" min={0} max={30}
                  value={balForm.annual_entitled}
                  onChange={e=>setBalForm((p:any)=>({...p,annual_entitled:parseInt(e.target.value)||0}))}
                  className="form-input"/>
                {(()=>{
                  const emp = employees.find(e=>e.id===balForm.employee_id)
                  if(!emp?.join_date) return null
                  const auto = calcAnnualEntitled(emp.join_date, balForm.year||saldoYear)
                  return <div className="text-[10.5px] text-teal-600 mt-1">
                    Auto dari join date: <strong>{auto} hari</strong>
                    {auto < 12 ? ' (proporsional)' : ' (full)'}
                  </div>
                })()}
              </div>
              <div>
                <label className="form-label">Carry-over (maks 5)</label>
                <input type="number" min={0} max={5}
                  value={balForm.annual_carryover}
                  onChange={e=>setBalForm((p:any)=>({...p,annual_carryover:Math.min(parseInt(e.target.value)||0,5)}))}
                  className="form-input"/>
                <div className="text-[10.5px] text-slate-400 mt-1">Sisa cuti tahun lalu, hangus Juli</div>
              </div>
            </div>

            <div>
              <label className="form-label">Hak Overtime Leave</label>
              <input type="number" min={0}
                value={balForm.overtime_entitled}
                onChange={e=>setBalForm((p:any)=>({...p,overtime_entitled:parseInt(e.target.value)||0}))}
                className="form-input"/>
              <div className="text-[10.5px] text-slate-400 mt-1">Jumlah hari OT yang disetujui HC</div>
            </div>

            <div>
              <label className="form-label">Catatan</label>
              <input value={balForm.notes||''}
                onChange={e=>setBalForm((p:any)=>({...p,notes:e.target.value}))}
                className="form-input" placeholder="Alasan penyesuaian saldo..."/>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-[12px] text-blue-700">
              Total saldo tahunan: <strong>{(balForm.annual_entitled||0)+(balForm.annual_carryover||0)} hari</strong>
              <span className="text-blue-400 ml-2">({balForm.annual_entitled} hak + {balForm.annual_carryover} carry-over)</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={()=>setShowBalModal(false)} className="btn btn-ghost">Batal</button>
              <button onClick={saveBalance} disabled={saving} className="btn btn-teal">
                {saving?'Menyimpan...':'Simpan Saldo'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

function OvertimeModal({ employees, balances, onSave, onClose, saving }: { employees:any[]; balances:any[]; onSave:(empId:string,days:number,note:string)=>void; onClose:()=>void; saving?:boolean }) {
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
          <button onClick={onClose} className="btn btn-ghost" disabled={saving}>Batal</button>
          <button
            disabled={saving||!empId}
            onClick={()=>{if(!empId)return alert('Pilih karyawan');onSave(empId,days,note)}}
            className="btn btn-teal">
            {saving?'Menyimpan...':(`Tambah ${days} Hari`)}
          </button>
        </div>
      </div>
    </Modal>
  )
}
