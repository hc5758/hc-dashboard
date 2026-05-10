'use client'
import { cn, initials, avatarColor, statusLabel, statusBadgeClass } from '@/lib/utils'

export function Badge({ children, variant = 'gray', className }: { children?: React.ReactNode; variant?: string; className?: string }) {
  const v: Record<string,string> = {
    teal:'bg-teal-50 text-teal-700 border-teal-200', navy:'bg-slate-100 text-slate-700 border-slate-200',
    red:'bg-red-50 text-red-700 border-red-200', amber:'bg-amber-50 text-amber-700 border-amber-200',
    blue:'bg-blue-50 text-blue-700 border-blue-200', purple:'bg-purple-50 text-purple-700 border-purple-200',
    green:'bg-green-50 text-green-700 border-green-200', gray:'bg-slate-100 text-slate-600 border-slate-200',
  }
  return <span className={cn('inline-flex items-center text-[10.5px] font-semibold px-2 py-0.5 rounded-full border', v[variant]??v.gray, className)}>{children}</span>
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={cn('inline-flex items-center text-[10.5px] font-semibold px-2 py-0.5 rounded-full border', statusBadgeClass(status))}>{statusLabel(status)}</span>
}

export function KPICard({ label, value, change, changeType='flat', accent='bg-teal-500', icon }: {
  label: string; value: string|number; change?: string; changeType?: 'up'|'down'|'flat'; accent?: string; icon?: React.ReactNode
}) {
  return (
    <div className="kpi-card">
      {icon && <div className={cn('kpi-icon', accent)}>{icon}</div>}
      <div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        {change && (
          <div className={cn('kpi-change', changeType==='up'?'ch-up':changeType==='down'?'ch-down':'ch-flat')}>
            {changeType==='up'&&'▲'}{changeType==='down'&&'▼'} {change}
          </div>
        )}
      </div>
    </div>
  )
}

export function ProgressBar({ value, max=100, color='bg-teal-500', label, showPct }: { value:number; max?:number; color?:string; label?:string; showPct?:boolean }) {
  const pct = Math.min(Math.round((value/max)*100),100)
  return (
    <div>
      {(label||showPct) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-[11.5px] text-slate-700 font-medium">{label}</span>}
          {showPct && <span className="text-[10.5px] font-semibold text-slate-500">{pct}%</span>}
        </div>
      )}
      <div className="prog-bar"><div className={cn('prog-fill',color)} style={{width:`${pct}%`}}/></div>
    </div>
  )
}

export function FunnelRow({ label, count, total, color='bg-[#0f1e3d]' }: { label:string; count:number; total:number; color?:string }) {
  const pct = total>0?Math.round((count/total)*100):0
  return (
    <div className="funnel-row">
      <div className="funnel-lbl">{label}</div>
      <div className="funnel-track"><div className={cn('funnel-fill',color)} style={{width:`${Math.max(pct,2)}%`}}><span className="text-[11px] font-semibold text-white">{count}</span></div></div>
      <div className="funnel-pct">{pct}%</div>
    </div>
  )
}

export function InlineBar({ label, value, pct, color='bg-[#0f1e3d]' }: { label:string; value:string|number; pct:number; color?:string; key?:string }) {
  return (
    <div className="bar-row">
      <div className="bar-lbl">{label}</div>
      <div className="bar-track"><div className={cn('bar-fill',color)} style={{width:`${Math.max(pct,4)}%`}}><span className="text-[10px] font-semibold text-white whitespace-nowrap">{value}</span></div></div>
    </div>
  )
}

export function Avatar({ name, size='md' }: { name:string; size?:'sm'|'md'|'lg' }) {
  const sz = {sm:'w-7 h-7 text-[9px]',md:'w-9 h-9 text-[11px]',lg:'w-11 h-11 text-[13px]'}[size]
  const colors = ['bg-teal-100 text-teal-800','bg-blue-100 text-blue-800','bg-purple-100 text-purple-800','bg-amber-100 text-amber-800','bg-slate-100 text-slate-800','bg-red-100 text-red-800']
  const color = colors[(name.charCodeAt(0)??0)%colors.length]
  return <div className={cn('rounded-full flex items-center justify-center font-semibold flex-shrink-0',sz,color)}>{initials(name)}</div>
}

export function ChkBtn({ value, onChange }: { value:boolean; onChange?:(v:boolean)=>void }) {
  return (
    <button onClick={()=>onChange?.(!value)} className={cn('chk-btn',value?'chk-on':'chk-off')}>
      {value?'✓':'–'}
    </button>
  )
}

export function InsightCard({ title, text, color='bg-[#0f1e3d]', titleColor='text-teal-300' }: { title:string; text:string; color?:string; titleColor?:string }) {
  return (
    <div className={cn('rounded-xl p-5',color)}>
      <div className={cn('text-[12px] font-semibold mb-2',titleColor)}>{title}</div>
      <div className="text-[11.5px] text-white/60 leading-relaxed">{text}</div>
    </div>
  )
}

export function EmptyState({ message='Belum ada data' }: { message?:string }) {
  return <tr><td colSpan={99} className="px-4 py-8 text-center text-[12px] text-slate-400">{message}</td></tr>
}

export function Spinner() {
  return <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"/></div>
}

// Template download button — arahkan ke sheet tertentu di file template
export function TemplateBtn({ sheet }: { sheet: string }) {
  return (
    <a
      href="/templates/template-import-hc-dashboard.xlsx"
      download="template-import-hc-dashboard.xlsx"
      title={`Download template ${sheet}`}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 transition-all"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Template
    </a>
  )
}
