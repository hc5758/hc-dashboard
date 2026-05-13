import { createServiceClient } from '@/lib/supabase/server'
import { decryptMany } from '@/lib/crypto'
export const dynamic = 'force-dynamic'
export const revalidate = 0
import Topbar from '@/components/layout/Topbar'
import { Badge } from '@/components/ui'
import { fmtDate, daysUntil, calcYoSDecimal, fmtCurrencyShort } from '@/lib/utils'
import OnboardingTable from './OnboardingTable'

export default async function DashboardPage() {
  const db = createServiceClient()
  const [
    { data: employees }, { data: contracts }, { data: onboarding },
    { data: offboarding }, { data: recruitment }, { data: tna },
    { data: pip }, { data: leave }, { data: salary },
  ] = await Promise.all([
    db.from('employees').select('*').order('full_name'),
    db.from('contracts').select('*, employee:employees(full_name,division,employment_type)').eq('is_active',true),
    db.from('onboarding').select('*, employee:employees(full_name,position,division)').order('created_at',{ascending:false}),
    db.from('offboarding').select('*, employee:employees(full_name,division,join_date)').order('report_date',{ascending:false}),
    db.from('recruitment').select('*, candidates:recruitment_candidates(id,stage)').order('created_at',{ascending:false}),
    db.from('tna_records').select('*, employee:employees(full_name,division)').order('created_at',{ascending:false}),
    db.from('pip_sp').select('*, employee:employees(full_name,division)').eq('status','Active'),
    db.from('attendance_leave').select('*, employee:employees(full_name,division)').eq('status','Approved'),
    db.from('salary_records').select('*, employee:employees(full_name,division)').eq('year',2026).eq('month',5),
  ])

  const decryptedEmployees = await decryptMany(employees??[], [{key:'full_name',type:'string'}])
  const active  = decryptedEmployees.filter(e=>e.status==='active')
  const today   = new Date()
  const todayMonth = today.getMonth() + 1
  const todayDay   = today.getDate()

  // Ulang tahun hari ini
  const birthdayToday = active.filter(e => {
    if (!e.birth_date) return false
    const b = new Date(e.birth_date + 'T00:00:00')
    return b.getMonth() + 1 === todayMonth && b.getDate() === todayDay
  })
  const expiringContracts = (contracts??[]).filter(c=>{ const d=daysUntil(c.end_date); return d>=0&&d<=60 }).sort((a,b)=>daysUntil(a.end_date)-daysUntil(b.end_date))
  const openRec    = (recruitment??[]).filter(r=>['Open','In Progress','Offering'].includes(r.status||r.hiring_process||''))
  const tnaOverdue = (tna??[]).filter(t=>t.status==='Overdue')
  const totalSalary = (salary??[]).reduce((s,r)=>s+(r.net_salary??0),0)
  const avgYoS = active.length>0?(active.reduce((s,e)=>s+calcYoSDecimal(e.join_date),0)/active.length).toFixed(1):'0'
  const onLeaveToday = (leave??[]).filter(l=>{ const s=new Date(l.start_date),e=new Date(l.end_date); return today>=s&&today<=e })
  const resignQ2 = (offboarding??[]).filter(o=>o.offboard_type==='Resign').length
  const hired = (recruitment??[]).filter(r=>r.status==='Hired'||r.hiring_process==='Joined').length

  const KPIs = [
    { label:'Total Headcount',     value: active.length,                       sub:'+3 MoM',           icon:'👥', color:'bg-teal-500',   light:'bg-teal-50',   text:'text-teal-700',   href:'/workforce' },
    { label:'Avg Years of Service',value: `${avgYoS} yr`,                      sub:'rata-rata',        icon:'⏱',  color:'bg-amber-500',  light:'bg-amber-50',  text:'text-amber-700',  href:null },
    { label:'Kontrak Habis <60hr', value: expiringContracts.length,            sub: expiringContracts.length>0?'urgent':'semua aman', icon:'📋', color:'bg-red-500', light:'bg-red-50', text:'text-red-700', href:'/workforce' },
    { label:'TNA Overdue',         value: tnaOverdue.length,                   sub: tnaOverdue.length>0?'perlu action':'aman',  icon:'📚', color:'bg-blue-500', light:'bg-blue-50', text:'text-blue-700', href:'/learning' },
    { label:'Payroll Mei 2026',    value: fmtCurrencyShort(totalSalary),       sub:'+4.2% MoM',        icon:'💰', color:'bg-purple-500', light:'bg-purple-50', text:'text-purple-700', href:'/payroll' },
  ]

  return (
    <div className="page-wrapper">
      <Topbar title="Dashboard" subtitle="Q2 · 2026"/>
      <div className="page-content">

        {/* ── HERO ── */}
        <div className="rounded-2xl bg-[#0f1e3d] overflow-hidden relative">
          {/* decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none"/>
          <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-blue-400/5 rounded-full translate-y-1/2 pointer-events-none"/>

          <div className="relative grid grid-cols-12">
            {/* Left: greeting */}
            <div className="col-span-5 p-7 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">👋</span>
                <h2 className="text-white text-[22px] font-bold">Halo, <span className="text-teal-300">Admin HC!</span></h2>
              </div>
              <p className="text-white/50 text-[12.5px] leading-relaxed mb-5 max-w-sm">
                {expiringContracts.length>0&&<span className="text-amber-300 font-semibold">{expiringContracts.length} kontrak</span>} {expiringContracts.length>0&&'habis dalam 60 hari. '}
                {tnaOverdue.length>0&&<><span className="text-red-300 font-semibold">{tnaOverdue.length} TNA</span> masih overdue. </>}
                {onLeaveToday.length>0&&<><span className="text-blue-300 font-semibold">{onLeaveToday.length} karyawan</span> cuti hari ini.</>}
                {expiringContracts.length===0&&tnaOverdue.length===0&&onLeaveToday.length===0&&'Semua berjalan lancar hari ini! 🎉'}
              </p>
              <div className="flex gap-2 flex-wrap">
                <a href="/recruitment" className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-400 hover:bg-teal-300 text-[#0f1e3d] text-[12px] font-bold rounded-lg transition-colors">
                  🎯 Pipeline Recruitment
                </a>
                <a href="/workforce" className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-[12px] font-semibold rounded-lg transition-colors border border-white/20">
                  👥 Data Karyawan
                </a>
              </div>
            </div>

            {/* Divider */}
            <div className="col-span-1 flex items-center justify-center">
              <div className="w-px h-3/4 bg-white/10"/>
            </div>

            {/* Right: stat blocks */}
            <div className="col-span-6 grid grid-cols-3 divide-x divide-white/10">
              {[
                { n: active.length,                                                        label:'Karyawan Aktif',     icon:'✅', color:'text-teal-300' },
                { n: active.filter(e=>e.employment_type==='PKWTT').length,                 label:'Karyawan Tetap',     icon:'🏢', color:'text-blue-300' },
                { n: resignQ2,                                                             label:'Resign Q2 2026',     icon:'🚪', color:'text-red-300' },
                { n: openRec.length,                                                       label:'Posisi Terbuka',     icon:'🔎', color:'text-amber-300' },
                { n: hired,                                                                label:'Hired YTD',          icon:'🎉', color:'text-teal-300' },
                { n: (pip??[]).length,                                                     label:'PIP/SP Aktif',       icon:'⚠️', color:'text-orange-300' },
              ].map((s,i)=>(
                <div key={i} className="p-5 flex flex-col justify-center hover:bg-white/5 transition-colors">
                  <div className="text-[18px] mb-0.5">{s.icon}</div>
                  <div className={`text-3xl font-bold leading-none mb-1 ${s.color}`}>{s.n}</div>
                  <div className="text-white/40 text-[10.5px] font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── KPI CARDS ── */}
        <div className="grid grid-cols-5 gap-3">
          {KPIs.map((k,i)=>(
            <a key={i} href={k.href||'#'}
              className="card p-4 flex items-start gap-3 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${k.light}`}>
                {k.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10.5px] text-slate-400 font-medium mb-1">{k.label}</div>
                <div className="text-[22px] font-bold text-slate-900 leading-none">{k.value}</div>
                <div className={`text-[10.5px] font-semibold mt-1.5 ${k.text}`}>{k.sub}</div>
              </div>
              <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${k.color}`}/>
            </a>
          ))}
        </div>

        {/* ── MAIN CONTENT: 3 columns ── */}
        <div className="grid grid-cols-3 gap-4">

          {/* Recruitment pipeline */}
          <div className="col-span-2 card">
            <div className="card-head">
              <span className="card-title">Pipeline Recruitment Aktif</span>
              <div className="flex items-center gap-2">
                <Badge variant="blue">{openRec.length} posisi</Badge>
                <a href="/recruitment" className="text-[11px] text-teal-600 hover:underline font-semibold">Lihat semua →</a>
              </div>
            </div>
            {openRec.length===0
              ? <div className="px-5 py-8 text-center text-[12px] text-slate-400">Tidak ada posisi terbuka</div>
              : openRec.slice(0,5).map(r=>{
                return(
                  <a key={r.id} href="/recruitment"
                    className="flex items-center gap-4 px-5 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-slate-800 truncate">{r.position}</div>
                      <div className="text-[10.5px] text-slate-400 mt-0.5">{r.division} · {r.entity}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 min-w-[120px]">
                      {(() => {
                        const hp = r.hiring_process||r.status||'Open'
                        const pct = ({Open:5,Screening:25,Interview:50,Offering:70,'OL Signed':85,Joined:100,'In Progress':35} as any)[hp]??20
                        return <>
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[10px] text-slate-400">{hp}</span>
                            <span className="text-[10px] font-bold text-slate-600">{pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-teal-400 rounded-full" style={{width:`${pct}%`}}/>
                          </div>
                        </>
                      })()}
                    </div>
                    {(() => {
                      const candCount = r.candidates?.length ?? r.total_applicants ?? 0
                      return candCount > 0 ? (
                        <div className="text-center flex-shrink-0">
                          <div className="text-[15px] font-bold text-teal-600">{candCount}</div>
                          <div className="text-[9px] text-slate-400">kandidat</div>
                        </div>
                      ) : null
                    })()}
                  </a>
                )
              })
            }
          </div>

          {/* Kontrak + Cuti hari ini */}
          <div className="flex flex-col gap-4">
            {/* Kontrak habis */}
            <div className="card flex-1">
              <div className="card-head">
                <span className="card-title">Kontrak Habis &lt;60hr</span>
                <Badge variant={expiringContracts.length>0?'red':'teal'}>{expiringContracts.length}</Badge>
              </div>
              {expiringContracts.length===0
                ? <div className="px-5 py-5 flex items-center gap-3">
                    <div className="text-2xl">✅</div>
                    <div className="text-[12px] text-slate-500">Semua kontrak aman</div>
                  </div>
                : expiringContracts.slice(0,4).map(c=>{ const d=daysUntil(c.end_date); return(
                  <div key={c.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 last:border-0">
                    <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${d<=7?'bg-red-50':d<=14?'bg-amber-50':'bg-slate-50'}`}>
                      <div className={`text-[15px] font-bold leading-none ${d<=7?'text-red-600':d<=14?'text-amber-600':'text-slate-600'}`}>{d}</div>
                      <div className="text-[8px] text-slate-400">hari</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-semibold text-slate-800 truncate">{c.employee?.full_name}</div>
                      <div className="text-[10.5px] text-slate-400">{c.employee?.division}</div>
                    </div>
                  </div>
                )})
              }
            </div>

            {/* Cuti hari ini */}
            <div className="card">
              <div className="card-head">
                <span className="card-title">Cuti Hari Ini</span>
                <Badge variant={onLeaveToday.length>0?'amber':'gray'}>{onLeaveToday.length} orang</Badge>
              </div>
              {onLeaveToday.length===0
                ? <div className="px-5 py-3 text-[12px] text-slate-400">Tidak ada yang cuti hari ini</div>
                : onLeaveToday.slice(0,3).map(l=>(
                  <div key={l.id} className="flex items-center gap-3 px-4 py-2 border-b border-slate-50 last:border-0">
                    <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-[10px] flex-shrink-0">
                      {l.employee?.full_name?.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-semibold text-slate-800 truncate">{l.employee?.full_name}</div>
                      <div className="text-[10px] text-slate-400">{l.leave_type}</div>
                    </div>
                  </div>
                ))
              }
            </div>

            {/* Ulang Tahun Hari Ini */}
            <div className="card">
              <div className="card-head">
                <span className="card-title">🎂 Ulang Tahun Hari Ini</span>
                <Badge variant={birthdayToday.length>0?'teal':'gray'}>{birthdayToday.length} orang</Badge>
              </div>
              {birthdayToday.length===0
                ? <div className="px-5 py-3 text-[12px] text-slate-400">Tidak ada ulang tahun hari ini</div>
                : birthdayToday.map(e=>{
                    const age = today.getFullYear() - new Date(e.birth_date+'T00:00:00').getFullYear()
                    return(
                      <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 last:border-0">
                        <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-[11px] flex-shrink-0">
                          {e.full_name?.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12.5px] font-semibold text-slate-800 truncate">{e.full_name}</div>
                          <div className="text-[10.5px] text-slate-400">{e.division} · {age} tahun</div>
                        </div>
                        <div className="text-lg">🎉</div>
                      </div>
                    )
                  })
              }
            </div>
          </div>
        </div>

        {/* ── ONBOARDING CHECKLIST ── */}
        <OnboardingTable onboarding={onboarding??[]}/>

        {/* ── PIP + Insights side by side ── */}
        <div className="grid grid-cols-3 gap-4">
          {/* PIP */}
          {(pip??[]).length>0&&(
            <div className="col-span-2 card">
              <div className="card-head">
                <span className="card-title">PIP / SP Monitoring Aktif</span>
                <Badge variant="red">{pip?.length} karyawan</Badge>
              </div>
              <table className="tbl">
                <thead><tr><th>Karyawan</th><th>Divisi</th><th>Tipe</th><th>Mulai</th><th>Deadline</th><th>Rencana Perbaikan</th></tr></thead>
                <tbody>
                  {(pip??[]).map(p=>(
                    <tr key={p.id}>
                      <td className="font-semibold">{p.employee?.full_name}</td>
                      <td className="text-slate-400 text-[11.5px]">{p.employee?.division}</td>
                      <td><Badge variant={p.type==='PIP'?'red':'amber'}>{p.type}</Badge></td>
                      <td className="text-slate-400 text-[11.5px]">{fmtDate(p.issue_date)}</td>
                      <td className="text-slate-400 text-[11.5px]">{fmtDate(p.end_date)}</td>
                      <td className="text-slate-500 text-[11.5px] max-w-[200px]"><span className="line-clamp-1">{p.improvement_plan??'–'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Dynamic Insights */}
          {(()=>{
            const insights: {icon:string,title:string,text:string,color:string,titleColor:string}[] = []

            // Headcount trend
            const activeCount = active.length
            if(activeCount>0) insights.push({
              icon:'📈',
              title:`${activeCount} karyawan aktif`,
              text:`Total headcount saat ini. ${expiringContracts.length>0?`${expiringContracts.length} kontrak habis dalam 60 hari — perlu keputusan segera.`:'Semua kontrak dalam kondisi aman.'}`,
              color:'bg-[#0f1e3d]', titleColor:'text-teal-300'
            })

            // TNA overdue
            if(tnaOverdue.length>0) insights.push({
              icon:'📚',
              title:`${tnaOverdue.length} TNA Overdue`,
              text:`${tnaOverdue.slice(0,2).map((t:any)=>t.employee?.full_name?.split(' ')[0]).join(' & ')}${tnaOverdue.length>2?` +${tnaOverdue.length-2} lainnya`:''} belum menyelesaikan training melewati deadline.`,
              color:'bg-amber-700/80', titleColor:'text-amber-200'
            })

            // Birthday today
            if(birthdayToday.length>0) insights.push({
              icon:'🎂',
              title:`${birthdayToday.length} karyawan ulang tahun hari ini`,
              text:`${birthdayToday.map(e=>e.full_name?.split(' ')[0]).join(', ')} — jangan lupa ucapkan selamat!`,
              color:'bg-teal-700/80', titleColor:'text-teal-100'
            })

            // On leave today
            if(onLeaveToday.length>0) insights.push({
              icon:'📅',
              title:`${onLeaveToday.length} karyawan cuti hari ini`,
              text:`${onLeaveToday.slice(0,2).map((l:any)=>l.employee?.full_name?.split(' ')[0]).join(' & ')}${onLeaveToday.length>2?` +${onLeaveToday.length-2} lainnya`:''} tidak hadir hari ini.`,
              color:'bg-blue-900/70', titleColor:'text-blue-200'
            })

            // PIP active
            if((pip??[]).length>0) insights.push({
              icon:'⚠️',
              title:`${(pip??[]).length} karyawan dalam monitoring PIP/SP`,
              text:`Pastikan check-in rutin dan dokumentasi progress improvement plan sesuai jadwal yang ditetapkan.`,
              color:'bg-red-900/70', titleColor:'text-red-300'
            })

            const shown = insights.slice(0, 3)
            return(
              <div className={`flex flex-col gap-3 ${(pip??[]).length>0?'':'col-span-3 grid grid-cols-3'}`}>
                {shown.map((ins,i)=>(
                  <div key={i} className={`rounded-xl ${ins.color} p-5`}>
                    <div className={`${ins.titleColor} text-[12px] font-semibold mb-2`}>{ins.icon} {ins.title}</div>
                    <div className="text-white/60 text-[11.5px] leading-relaxed">{ins.text}</div>
                  </div>
                ))}
              </div>
            )
          })()}
        </div>

      </div>
    </div>
  )
}
