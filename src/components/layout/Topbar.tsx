'use client'
import { Bell, Search, ChevronDown, X, Building2, Users, Briefcase, BookOpen, DollarSign, BarChart2, Heart } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const PAGES = [
  { label:'Workforce', href:'/workforce', icon:'👥', keys:['workforce','karyawan','pegawai','sdm'] },
  { label:'Recruitment', href:'/recruitment', icon:'🎯', keys:['rekrut','recruitment','hiring','posisi'] },
  { label:'Manajemen Cuti', href:'/attendance', icon:'📅', keys:['cuti','leave','attendance','libur'] },
  { label:'Turnover', href:'/turnover', icon:'🚪', keys:['turnover','resign','keluar','offboard'] },
  { label:'Performance', href:'/performance', icon:'⭐', keys:['performance','performa','pip','sp','kpi'] },
  { label:'Learning & Dev', href:'/learning', icon:'📚', keys:['learning','tna','training','belajar'] },
  { label:'Payroll', href:'/payroll', icon:'💰', keys:['payroll','gaji','salary','bpjs','pph'] },
  { label:'Engagement', href:'/engagement', icon:'💬', keys:['engagement','survei','survey','enps'] },
]

export default function Topbar({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  const router = useRouter()
  const [showNotif, setShowNotif] = useState(false)
  const [notifs, setNotifs]       = useState<any[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])
  const [search, setSearch]       = useState('')
  const [showSuggest, setShowSuggest] = useState(false)
  const [employees, setEmployees] = useState<any[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(()=>{
    fetch('/api/notifications').then(r=>r.json()).then(d=>{ if(d.data) setNotifs(d.data) }).catch(()=>{})
    // Load employees for search
    fetch('/api/employees').then(r=>r.json()).then(d=>{ if(d.data) setEmployees(d.data) }).catch(()=>{})
  },[])

  const visible = notifs.filter(n=>!dismissed.includes(n.id))
  function dismiss(id:string){ setDismissed(p=>[...p,id]) }
  function dismissAll(){ setDismissed(notifs.map(n=>n.id)) }

  // Search suggestions
  const suggestions = search.trim().length < 2 ? [] : [
    // Page suggestions
    ...PAGES.filter(p => p.keys.some(k=>k.includes(search.toLowerCase()))||p.label.toLowerCase().includes(search.toLowerCase()))
      .map(p=>({ type:'page', label:p.label, sub:'Halaman', icon:p.icon, href:p.href })),
    // Employee suggestions
    ...employees.filter(e=>e.full_name?.toLowerCase().includes(search.toLowerCase())||e.employee_id?.toLowerCase().includes(search.toLowerCase()))
      .slice(0,4)
      .map(e=>({ type:'employee', label:e.full_name, sub:`${e.employee_id} · ${e.division}`, icon:'👤', href:`/workforce?q=${encodeURIComponent(e.full_name)}` })),
  ].slice(0,6)

  function navigate(href:string){
    router.push(href)
    setSearch('')
    setShowSuggest(false)
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { setSearch(''); setShowSuggest(false); return }
    if (e.key !== 'Enter' || !search.trim()) return
    if (suggestions.length > 0) { navigate(suggestions[0].href); return }
    // Fallback fuzzy
    const q = search.toLowerCase()
    const page = PAGES.find(p=>p.keys.some(k=>q.includes(k)))
    navigate(page?.href || '/workforce')
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 h-[54px] flex items-center gap-3 flex-shrink-0">
      <div>
        <h1 className="text-[14px] font-semibold text-slate-800">{title}</h1>
        {subtitle && <p className="text-[10.5px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex-1" />
      {right}

      {/* Search */}
      <div className="relative">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-64 focus-within:border-teal-400 focus-within:bg-white transition-all">
          <Search size={13} className="text-slate-400 flex-shrink-0" />
          <input ref={inputRef} value={search}
            onChange={e=>{ setSearch(e.target.value); setShowSuggest(true) }}
            onKeyDown={handleKey}
            onFocus={()=>setShowSuggest(true)}
            onBlur={()=>setTimeout(()=>setShowSuggest(false),150)}
            placeholder="Cari karyawan atau halaman..." className="bg-transparent text-[12px] text-slate-700 placeholder:text-slate-400 outline-none w-full" />
          {search&&<button onClick={()=>{setSearch('');setShowSuggest(false)}} className="text-slate-300 hover:text-slate-500"><X size={12}/></button>}
        </div>

        {/* Suggestions dropdown */}
        {showSuggest && suggestions.length > 0 && (
          <div className="absolute left-0 top-full mt-1.5 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
            {suggestions.map((s,i)=>(
              <button key={i} onMouseDown={()=>navigate(s.href)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left transition-colors">
                <span className="text-lg flex-shrink-0">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-semibold text-slate-800 truncate">{s.label}</div>
                  <div className="text-[10.5px] text-slate-400">{s.sub}</div>
                </div>
                {s.type==='page'&&<span className="text-[9.5px] text-slate-300 border border-slate-200 rounded px-1.5 py-0.5 flex-shrink-0">Halaman</span>}
              </button>
            ))}
            <div className="px-4 py-2 border-t border-slate-100 text-[10px] text-slate-300">Enter untuk pilih pertama · Esc untuk tutup</div>
          </div>
        )}
      </div>

      {/* Entity filter */}
      <div className="flex items-center gap-1.5 text-[12px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-slate-100 transition-colors">
        <Building2 size={13} />
        <span>Semua Entitas</span>
        <ChevronDown size={12} />
      </div>

      {/* Notification */}
      <div className="relative">
        <button onClick={()=>setShowNotif(!showNotif)}
          className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell size={17} />
          {visible.length>0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">
              {visible.length}
            </span>
          )}
        </button>
        {showNotif && (
          <>
            <div className="fixed inset-0 z-40" onClick={()=>setShowNotif(false)} />
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="text-[13px] font-semibold text-slate-800">Notifikasi</span>
                <div className="flex items-center gap-2">
                  {visible.length>0 && <button onClick={dismissAll} className="text-[10.5px] text-slate-400 hover:text-slate-600">Hapus semua</button>}
                  <button onClick={()=>setShowNotif(false)} className="text-slate-300 hover:text-slate-600"><X size={14}/></button>
                </div>
              </div>
              {visible.length===0
                ? <div className="px-4 py-8 text-center text-[12px] text-slate-400">Tidak ada notifikasi</div>
                : visible.map(n=>(
                  <div key={n.id} onClick={()=>{ if(n.href) router.push(n.href); setShowNotif(false) }}
                    className="flex items-start gap-3 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-slate-800">{n.title}</div>
                      <div className="text-[10.5px] text-slate-400 mt-0.5">{n.desc}</div>
                      {n.time&&<div className="text-[10px] text-slate-300 mt-1">{n.time}</div>}
                    </div>
                    <button onClick={e=>{e.stopPropagation();dismiss(n.id)}} className="text-slate-200 hover:text-slate-400 flex-shrink-0"><X size={12}/></button>
                  </div>
                ))
              }
            </div>
          </>
        )}
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-2 cursor-pointer">
        <div className="w-8 h-8 rounded-full bg-[#0f1e3d] flex items-center justify-center text-teal-300 font-semibold text-[10px] border-2 border-[#2ab89a]">AH</div>
        <div className="hidden sm:block">
          <div className="text-[12px] font-semibold text-slate-700">Admin HC</div>
          <div className="text-[10px] text-slate-400">HR Manager</div>
        </div>
      </div>
    </header>
  )
}
