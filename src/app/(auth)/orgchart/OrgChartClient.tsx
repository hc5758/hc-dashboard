'use client'
import { useState, useMemo } from 'react'

const LEVEL_ORDER = ['Director','Commissioner','Comissioner','Head','Jr. Manager','Manager','Sr. Manager','Sr. Specialist','Specialist','Sr. Officer','Officer','Sr. Staff','Staff','Jr. Staff','Associate','Jr. Specialist']
const LEVEL_COLOR: Record<string,string> = {
  'Director':'bg-[#0f1e3d] text-white',
  'Commissioner':'bg-[#0f1e3d] text-white',
  'Comissioner':'bg-[#0f1e3d] text-white',
  'Head':'bg-teal-600 text-white',
  'Manager':'bg-teal-500 text-white',
  'Jr. Manager':'bg-teal-400 text-white',
  'Sr. Manager':'bg-teal-500 text-white',
}
function levelColor(level:string){ return LEVEL_COLOR[level]||'bg-slate-100 text-slate-700' }
function initials(name:string){ return name.split(' ').slice(0,2).map(n=>n[0]).join('').toUpperCase() }

function Avatar({name,level}:{name:string,level:string}){
  const isTop = ['Director','Commissioner','Comissioner','Head'].includes(level)
  return(
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${isTop?'bg-teal-600 text-white':'bg-slate-200 text-slate-600'}`}>
      {initials(name)}
    </div>
  )
}

function EmployeeCard({emp}:{emp:any}){  // eslint-disable-line
  const [hover,setHover]=useState(false)
  return(
    <div
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      className="relative flex flex-col items-center gap-1 cursor-default"
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0 ring-2 transition-all ${['Director','Commissioner','Comissioner','Head'].includes(emp.level)?'bg-teal-600 text-white ring-teal-200':'bg-white text-slate-700 ring-slate-200'}`}>
        {initials(emp.full_name)}
      </div>
      <div className="text-center max-w-[90px]">
        <div className="text-[10.5px] font-semibold text-slate-800 leading-tight truncate">{emp.full_name.split(' ')[0]}</div>
        <div className="text-[9px] text-slate-400 leading-tight truncate">{emp.position.replace(/\b(Jr\.|Sr\.)\s/g,'').replace(/(Manager|Officer|Staff|Specialist|Head|Director)/g,'').trim()||emp.position}</div>
      </div>
      {hover&&(
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 bg-[#0f1e3d] text-white rounded-lg p-3 w-48 shadow-xl text-left pointer-events-none">
          <div className="font-semibold text-[12px]">{emp.full_name}</div>
          <div className="text-[10px] text-teal-300 mt-0.5">{emp.position}</div>
          <div className="text-[10px] text-slate-400 mt-1">{emp.division}</div>
          <div className="flex gap-1 mt-1.5 flex-wrap">
            <span className="text-[9px] bg-white/10 rounded px-1.5 py-0.5">{emp.level}</span>
            <span className="text-[9px] bg-white/10 rounded px-1.5 py-0.5">{emp.employment_type}</span>
            <span className="text-[9px] bg-white/10 rounded px-1.5 py-0.5">{emp.entity}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function DivisionCard({division,emps}:{division:string,emps:any[]}){
  const sorted = [...emps].sort((a,b)=>{
    const ai=LEVEL_ORDER.indexOf(a.level), bi=LEVEL_ORDER.indexOf(b.level)
    return (ai===-1?99:ai)-(bi===-1?99:bi)
  })
  const head = sorted[0]
  const rest = sorted.slice(1)

  return(
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4 min-w-[200px]">
      {/* Division header */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <div className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0"/>
        <div>
          <div className="font-bold text-[12px] text-slate-800">{division}</div>
          <div className="text-[10px] text-slate-400">{emps.length} karyawan</div>
        </div>
      </div>

      {/* Head/lead */}
      {head&&(
        <div className="flex flex-col items-center">
          <EmployeeCard emp={head}/>
          {rest.length>0&&(
            <div className="w-px h-4 bg-slate-200 mt-2"/>
          )}
        </div>
      )}

      {/* Members */}
      {rest.length>0&&(
        <div className="flex flex-wrap gap-3 justify-center">
          {rest.map((e:any)=><div key={e.id}><EmployeeCard emp={e}/></div>)}
        </div>
      )}
    </div>
  )
}

export default function OrgChartClient({employees}:{employees:any[]}){
  const [filterEntity,setFilterEntity]=useState('')
  const [view,setView]=useState<'division'|'entity'>('division')

  const entities = useMemo(()=>[...new Set(employees.map(e=>e.entity))].filter(Boolean).sort(),[employees])

  const filtered = useMemo(()=>
    filterEntity ? employees.filter(e=>e.entity===filterEntity) : employees
  ,[employees,filterEntity])

  // Group by division
  const byDiv = useMemo(()=>{
    const g: Record<string,any[]>={}
    filtered.forEach(e=>{
      if(!g[e.division]) g[e.division]=[]
      g[e.division].push(e)
    })
    return g
  },[filtered])

  // BOD/BOC at top
  const topDivs = ['BOD','BOC','KOM'].filter(d=>byDiv[d])
  const otherDivs = Object.keys(byDiv).filter(d=>!topDivs.includes(d)).sort()

  return(
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-lg overflow-hidden border border-slate-200">
          <button onClick={()=>setFilterEntity('')}
            className={`px-4 py-1.5 text-[12px] font-medium transition-colors ${!filterEntity?'bg-[#0f1e3d] text-white':'bg-white text-slate-500 hover:bg-slate-50'}`}>
            Semua Entitas
          </button>
          {entities.map(en=>(
            <button key={en} onClick={()=>setFilterEntity(filterEntity===en?'':en)}
              className={`px-4 py-1.5 text-[12px] font-medium transition-colors border-l border-slate-200 ${filterEntity===en?'bg-[#0f1e3d] text-white':'bg-white text-slate-500 hover:bg-slate-50'}`}>
              {en}
            </button>
          ))}
        </div>
        <div className="ml-auto text-[12px] text-slate-400">{filtered.length} karyawan aktif</div>
      </div>

      {/* BOD/BOC/KOM - top level */}
      {topDivs.length>0&&(
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Leadership</div>
          <div className="flex gap-4 flex-wrap">
            {topDivs.map((d,i)=><div key={i}><DivisionCard division={d} emps={byDiv[d] as any[]}/></div>)}
          </div>
        </div>
      )}

      {/* Connector line */}
      {topDivs.length>0&&otherDivs.length>0&&(
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200"/>
          <div className="text-[10px] text-slate-300 font-medium">DIVISI</div>
          <div className="flex-1 h-px bg-slate-200"/>
        </div>
      )}

      {/* All other divisions */}
      {otherDivs.length>0&&(
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Divisi</div>
          <div className="grid gap-4" style={{gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))'}}>
            {otherDivs.map((d,i)=><div key={i}><DivisionCard division={d} emps={byDiv[d] as any[]}/></div>)}
          </div>
        </div>
      )}
    </div>
  )
}
