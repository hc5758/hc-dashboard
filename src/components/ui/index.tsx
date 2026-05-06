'use client'
import { cn, statusBadgeClass, statusLabel } from '@/lib/utils'

// ── Badge ─────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode
  variant?: 'teal' | 'navy' | 'red' | 'amber' | 'blue' | 'purple' | 'green' | 'gray'
  className?: string
}
export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span className={cn(`badge badge-${variant}`, className)}>
      {children}
    </span>
  )
}

// ── Status Badge ──────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('badge', statusBadgeClass(status))}>
      {statusLabel(status)}
    </span>
  )
}

// ── KPI Card ──────────────────────────────────────────────
interface KPICardProps {
  label: string
  value: string | number
  change?: string
  changeType?: 'up' | 'down' | 'flat'
  accent?: string
  className?: string
}
export function KPICard({ label, value, change, changeType = 'flat', accent = 'bg-teal-400', className }: KPICardProps) {
  return (
    <div className={cn('kpi-card', className)}>
      <div className={cn('absolute top-0 right-0 w-1 h-full rounded-r-xl', accent)} />
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {change && (
        <div className={cn('kpi-change', {
          'kpi-change-up': changeType === 'up',
          'kpi-change-down': changeType === 'down',
          'kpi-change-flat': changeType === 'flat',
        })}>
          {changeType === 'up' && '▲'} {changeType === 'down' && '▼'} {change}
        </div>
      )}
    </div>
  )
}

// ── Progress Bar ──────────────────────────────────────────
interface ProgressBarProps {
  value: number
  max?: number
  color?: string
  height?: string
  label?: string
  showPct?: boolean
}
export function ProgressBar({ value, max = 100, color = 'bg-teal-400', height = 'h-1.5', label, showPct }: ProgressBarProps) {
  const pct = Math.min(Math.round((value / max) * 100), 100)
  return (
    <div>
      {(label || showPct) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-[11px] text-navy-700 font-medium">{label}</span>}
          {showPct && <span className="text-[10.5px] font-bold text-navy-500">{pct}%</span>}
        </div>
      )}
      <div className={cn('prog-bar', height)}>
        <div className={cn('prog-fill', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── Funnel Row ────────────────────────────────────────────
interface FunnelRowProps {
  label: string
  count: number
  total: number
  color?: string
}
export function FunnelRow({ label, count, total, color = 'bg-navy-800' }: FunnelRowProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="funnel-row">
      <div className="funnel-lbl">{label}</div>
      <div className="funnel-track">
        <div className={cn('funnel-fill', color)} style={{ width: `${pct || 2}%` }}>
          <span>{count}</span>
        </div>
      </div>
      <div className="funnel-pct">{pct}%</div>
    </div>
  )
}

// ── Inline Bar ────────────────────────────────────────────
interface InlineBarProps {
  label: string
  value: string | number
  pct: number
  color?: string
}
export function InlineBar({ label, value, pct, color = 'bg-navy-800' }: InlineBarProps) {
  return (
    <div className="bar-row">
      <div className="bar-lbl">{label}</div>
      <div className="bar-track">
        <div className={cn('bar-fill', color)} style={{ width: `${Math.max(pct, 4)}%` }}>
          <span>{value}</span>
        </div>
      </div>
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────────
import { initials, avatarColor } from '@/lib/utils'
interface AvatarProps { name: string; size?: 'sm' | 'md' | 'lg' }
export function Avatar({ name, size = 'md' }: AvatarProps) {
  const sizeClass = { sm: 'w-6 h-6 text-[8px]', md: 'w-8 h-8 text-[10px]', lg: 'w-10 h-10 text-[12px]' }[size]
  return (
    <div className={cn('rounded-full flex items-center justify-center font-extrabold flex-shrink-0', sizeClass, avatarColor(name))}>
      {initials(name)}
    </div>
  )
}

// ── Checklist Toggle ──────────────────────────────────────
interface ChkProps { value: boolean; onChange?: (v: boolean) => void }
export function ChkBtn({ value, onChange }: ChkProps) {
  return (
    <button
      onClick={() => onChange?.(!value)}
      className={cn('chk-btn flex items-center justify-center', value ? 'chk-on' : 'chk-off')}
    >
      {value ? '✓' : '–'}
    </button>
  )
}

// ── Insight Card ──────────────────────────────────────────
interface InsightProps {
  title: string
  text: string
  color?: string
  titleColor?: string
}
export function InsightCard({ title, text, color = 'bg-navy-800', titleColor = 'text-teal-300' }: InsightProps) {
  return (
    <div className={cn('rounded-xl p-5', color)}>
      <div className={cn('text-[12px] font-bold mb-2', titleColor)}>{title}</div>
      <div className="text-[11px] text-white/60 leading-relaxed">{text}</div>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────
export function EmptyState({ message = 'Belum ada data' }: { message?: string }) {
  return (
    <tr>
      <td colSpan={99} className="px-4 py-8 text-center text-[11px] text-navy-400">
        {message}
      </td>
    </tr>
  )
}

// ── Loading Spinner ───────────────────────────────────────
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
