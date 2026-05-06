'use client'
import { cn, initials, avatarColor, statusLabel, statusBadgeClass } from '@/lib/utils'

export function Badge({ children, variant = 'gray', className }: {
  children: React.ReactNode; variant?: string; className?: string
}) {
  return <span className={cn(`badge badge-${variant}`, className)}>{children}</span>
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={cn('badge', statusBadgeClass(status))}>{statusLabel(status)}</span>
}

export function KPICard({ label, value, change, changeType = 'flat', accent = 'bg-teal-400' }: {
  label: string; value: string | number; change?: string; changeType?: 'up' | 'down' | 'flat'; accent?: string
}) {
  return (
    <div className="kpi-card">
      <div className={cn('absolute top-0 right-0 w-1 h-full rounded-r-xl', accent)} />
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {change && (
        <div className={cn('kpi-change', changeType === 'up' ? 'kpi-change-up' : changeType === 'down' ? 'kpi-change-down' : 'kpi-change-flat')}>
          {changeType === 'up' && '▲'}{changeType === 'down' && '▼'} {change}
        </div>
      )}
    </div>
  )
}

export function ProgressBar({ value, max = 100, color = 'bg-teal-400', label, showPct }: {
  value: number; max?: number; color?: string; label?: string; showPct?: boolean
}) {
  const pct = Math.min(Math.round((value / max) * 100), 100)
  return (
    <div>
      {(label || showPct) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-[11px] text-navy-800 font-medium">{label}</span>}
          {showPct && <span className="text-[10.5px] font-bold text-navy-400">{pct}%</span>}
        </div>
      )}
      <div className="prog-bar"><div className={cn('prog-fill', color)} style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

export function FunnelRow({ label, count, total, color = 'bg-navy-800' }: {
  label: string; count: number; total: number; color?: string
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="funnel-row">
      <div className="funnel-lbl">{label}</div>
      <div className="funnel-track">
        <div className={cn('funnel-fill', color)} style={{ width: `${Math.max(pct, 2)}%` }}>
          <span className="text-[11px] font-bold text-white">{count}</span>
        </div>
      </div>
      <div className="funnel-pct">{pct}%</div>
    </div>
  )
}

export function InlineBar({ label, value, pct, color = 'bg-navy-800' }: {
  label: string; value: string | number; pct: number; color?: string
}) {
  return (
    <div className="bar-row">
      <div className="bar-lbl">{label}</div>
      <div className="bar-track">
        <div className={cn('bar-fill', color)} style={{ width: `${Math.max(pct, 4)}%` }}>
          <span className="text-[10px] font-bold text-white whitespace-nowrap">{value}</span>
        </div>
      </div>
    </div>
  )
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sz = { sm: 'w-6 h-6 text-[8px]', md: 'w-8 h-8 text-[10px]', lg: 'w-10 h-10 text-[12px]' }[size]
  return (
    <div className={cn('rounded-full flex items-center justify-center font-extrabold flex-shrink-0', sz, avatarColor(name))}>
      {initials(name)}
    </div>
  )
}

export function ChkBtn({ value, onChange }: { value: boolean; onChange?: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange?.(!value)} className={cn('chk-btn', value ? 'chk-on' : 'chk-off')}>
      {value ? '✓' : '–'}
    </button>
  )
}

export function InsightCard({ title, text, color = 'bg-navy-800', titleColor = 'text-teal-300' }: {
  title: string; text: string; color?: string; titleColor?: string
}) {
  return (
    <div className={cn('rounded-xl p-5', color)}>
      <div className={cn('text-[12px] font-bold mb-2', titleColor)}>{title}</div>
      <div className="text-[11px] text-white/60 leading-relaxed">{text}</div>
    </div>
  )
}

export function EmptyState({ message = 'Belum ada data' }: { message?: string }) {
  return (
    <tr><td colSpan={99} className="px-4 py-8 text-center text-[11px] text-navy-400">{message}</td></tr>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
