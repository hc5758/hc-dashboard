import { createServiceClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import { KPICard, Badge, InsightCard } from '@/components/ui'
import { fmtDate, daysUntil, calcYoSDecimal } from '@/lib/utils'
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
    db.from('recruitment').select('*').order('created_at',{ascending:false}),
    db.from('tna_records').select('*, employee:employees(full_name,division)').order('created_at',{ascending:false}),
    db.from('pip_sp').select('*, employee:employees(full_name,division)').eq('status','Active'),
    db.from('attendance_leave').select('*, employee:employees(full_name,division)').eq('status','Approved'),
    db.from('salary_records').select('*, employee:employees(full_name,division)').eq('year',2026).eq('month',5),
  ])

  const active = (employees??[]).filter(e=>e.status==='active')
  const today  = new Date()

  const expiringContracts = (contracts??[]).filter(c=>{ const d=daysUntil(c.end_date); return d>=0&&d<=30 })
    .sort((a,b)=>daysUntil(a.end_date)-daysUntil(b.end_date))

  const onLeaveNow = (leave??[]).filter(l=>{ const s=new Date(l.start_date),e=new Date(l.end_date); return today>=s&&today<=e })
  const openRec    = (recruitment??[]).filter(r=>['Open','In Progress','Offering'].includes(r.status))
  const tnaOverdue = (tna??[]).filter(t=>t.status==='Overdue')
  const totalSalary = (salary??[]).reduce((s,r)=>s+(r.net_salary??0),0)
  const avgYoS = active.length>0 ? (active.reduce((s,e)=>s+calcYoSDecimal(e.join_date),0)/active.length).toFixed(1) : '0'

  return (
    <div className="page-wrapper">
      <Topbar title="Dashboard" subtitle="Q2 · 2026"/>
      <div className="page-content">

        {/* Hero */}
        <div className="bg-[#0f1e3d] rounded-2xl grid grid-cols-2 min-h-[130px]">
          <div className="p-6 flex flex-col justify-center">
            <h2 className="text-white text-xl font-extrabold mb-1">Halo, <span className="text-teal-300">Admin HC!</span> 👋</h2>
            <p className="text-white/40 text-[11px] leading-relaxed mb-4">
              {expiringContracts.length>0&&<><strong className="text-white">{expiringContracts.length} kontrak</strong> habis dalam 30 hari. </>}
              {tnaOverdue.length>0&&<><strong className="text-white">{tnaOverdue.length} TNA</strong> overdue.</>}
            </p>
            <div className="flex gap-2">
              <a href="/recruitment" className="btn btn-teal btn-sm">Pipeline recruitment</a>
              <a href="/workforce" className="btn btn-ghost btn-sm">Data karyawan</a>
            </div>
          </div>
          <div className="border-l border-white/8 grid grid-cols-3 divide-x divide-white/8">
            {[
              {n:active.length,l:'Total aktif',c:'text-teal-300'},
              {n:active.filter(e=>e.employment_type==='PKWTT').length,l:'Karyawan tetap',c:'text-blue-300'},
              {n:(offboarding??[]).filter(o=>o.offboard_type==='Resign').length,l:'Resign Q2',c:'text-red-300'},
            ].map((s,i)=>(
              <div key={i} className="p-5 flex flex-col justify-center">
                <div className={`text-3xl font-extrabold leading-none ${s.c}`}>{s.n}</div>
                <div className="text-white/30 text-[10px] mt-1.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-5 gap-3">
          <KPICard label="Total headcount"     value={active.length}                             change="+3 MoM" changeType="up"   accent="bg-teal-400"/>
          <KPICard label="Avg years of service" value={`${avgYoS} yr`}                          change="stabil" changeType="flat" accent="bg-amber-400"/>
          <KPICard label="Kontrak habis <30hr"  value={expiringContracts.length}                change={expiringContracts.length>0?'urgent':'aman'} changeType={expiringContracts.length>0?'down':'flat'} accent="bg-red-400"/>
          <KPICard label="TNA overdue"          value={tnaOverdue.length}                       change={tnaOverdue.length>0?'perlu action':'aman'} changeType={tnaOverdue.length>0?'down':'flat'} accent="bg-blue-400"/>
          <KPICard label="Payroll Mei"          value={`Rp ${Math.round(totalSalary/1_000_000)} Jt`} change="+4.2% MoM" changeType="up" accent="bg-purple-400"/>
        </div>

        {/* 3 col */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 card">
            <div className="card-head"><span className="card-title">Pipeline recruitment terbuka</span><Badge variant="blue">{openRec.length} posisi</Badge></div>
            {openRec.length===0
              ? <div className="px-5 py-6 text-center text-[11px] text-slate-300">Tidak ada posisi terbuka</div>
              : openRec.slice(0,4).map(r=>(
                <div key={r.id} className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold text-slate-800 truncate">{r.position}</div>
                    <div className="text-[10px] text-slate-300">{r.division} · {r.entity}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-extrabold text-teal-600">{r.total_applicants}</div>
                    <div className="text-[9px] text-slate-300">kandidat</div>
                  </div>
                  <Badge variant={(r.status==='Offering'?'purple':'blue') as any}>{r.status}</Badge>
                </div>
              ))}
          </div>
          <div className="card">
            <div className="card-head"><span className="card-title">Kontrak habis &lt;30hr</span><Badge variant="red">{expiringContracts.length}</Badge></div>
            {expiringContracts.length===0
              ? <div className="px-5 py-6 text-center text-[11px] text-slate-300">Semua kontrak aman ✓</div>
              : expiringContracts.slice(0,5).map(c=>{ const d=daysUntil(c.end_date); return (
                <div key={c.id} className="flex items-center gap-2.5 px-4 py-2 border-b border-slate-50 last:border-0">
                  <div className="text-center min-w-[28px]">
                    <div className={`text-[16px] font-extrabold leading-none ${d<=7?'text-red-600':d<=14?'text-amber-600':'text-teal-600'}`}>{d}</div>
                    <div className="text-[8px] text-slate-300">hari</div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11.5px] font-bold text-slate-800 truncate">{c.employee?.full_name}</div>
                    <div className="text-[10px] text-slate-300">{c.employee?.division}</div>
                  </div>
                </div>
              )})}
          </div>
        </div>

        {/* Interactive onboarding checklist */}
        <OnboardingTable onboarding={onboarding??[]}/>

        {/* PIP aktif */}
        {(pip??[]).length>0&&(
          <div className="card">
            <div className="card-head"><span className="card-title">PIP / SP monitoring aktif</span><Badge variant="red">{pip?.length} karyawan</Badge></div>
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Karyawan</th><th>Divisi</th><th>Tipe</th><th>Mulai</th><th>Deadline</th><th>Rencana</th><th>Status</th></tr></thead>
                <tbody>
                  {(pip??[]).map(p=>(
                    <tr key={p.id}>
                      <td className="font-bold">{p.employee?.full_name}</td>
                      <td className="text-slate-400 text-[11px]">{p.employee?.division}</td>
                      <td><Badge variant={p.type==='PIP'?'red':'amber'}>{p.type}</Badge></td>
                      <td className="text-slate-400 text-[11px]">{fmtDate(p.issue_date)}</td>
                      <td className="text-slate-400 text-[11px]">{fmtDate(p.end_date)}</td>
                      <td className="text-slate-600 text-[11px] max-w-[180px]"><span className="line-clamp-1">{p.improvement_plan??'–'}</span></td>
                      <td><Badge variant="amber">{p.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="grid grid-cols-3 gap-3">
          <InsightCard title="Headcount growth sehat" text="Momentum +7.9% MoM driven oleh hiring Creative & Social Media. Target Q2 adalah 45 headcount."/>
          <InsightCard title={`${tnaOverdue.length} TNA overdue`} text="Perlu koordinasi dengan manager untuk akselerasi penyelesaian training yang sudah melewati deadline." color="bg-amber-700/80" titleColor="text-amber-200"/>
          <InsightCard title="Social Media: triple concern" text="Turnover 14.3%, engagement terendah (2.9/5), absensi tertinggi (8.2%). Perlu intervensi menyeluruh." color="bg-red-900/70" titleColor="text-red-300"/>
        </div>
      </div>
    </div>
  )
}
