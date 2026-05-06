import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, differenceInMonths, format, parseISO } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmtDate(date: string | Date | null | undefined): string {
  if (!date) return '–'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'd MMM yyyy', { locale: idLocale })
  } catch { return '–' }
}

export function fmtCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount)
}

export function fmtCurrencyShort(amount: number): string {
  if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)} M`
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(0)} Jt`
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)} Rb`
  return `Rp ${amount}`
}

export function calcYoS(joinDate: string): string {
  if (!joinDate) return '–'
  const months = differenceInMonths(new Date(), parseISO(joinDate))
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (years === 0) return `${rem} Bln`
  if (rem === 0) return `${years} Thn`
  return `${years} Thn ${rem} Bln`
}

export function calcYoSDecimal(joinDate: string): number {
  if (!joinDate) return 0
  return Math.round(differenceInMonths(new Date(), parseISO(joinDate)) / 12 * 10) / 10
}

export function daysUntil(date: string | null | undefined): number {
  if (!date) return 9999
  return differenceInDays(parseISO(date), new Date())
}

export function getCurrentQuarter(): Quarter {
  const m = new Date().getMonth() + 1
  if (m <= 3) return 'Q1'
  if (m <= 6) return 'Q2'
  if (m <= 9) return 'Q3'
  return 'Q4'
}

type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'

export function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export function avatarColor(name: string): string {
  const colors = [
    'bg-teal-50 text-teal-700',
    'bg-blue-50 text-blue-700',
    'bg-purple-50 text-purple-700',
    'bg-amber-50 text-amber-700',
    'bg-navy-50 text-navy-800',
    'bg-red-50 text-red-700',
  ]
  return colors[name.charCodeAt(0) % colors.length]
}

export function statusLabel(status: string): string {
  const m: Record<string, string> = {
    active: 'Aktif', inactive: 'Tidak Aktif',
    resigned: 'Resign', end_contract: 'End OC',
  }
  return m[status] ?? status
}

export function statusBadgeClass(status: string): string {
  const m: Record<string, string> = {
    active: 'bg-teal-50 text-teal-700 border-teal-200',
    inactive: 'bg-gray-100 text-gray-600 border-gray-200',
    resigned: 'bg-red-50 text-red-700 border-red-200',
    end_contract: 'bg-blue-50 text-blue-700 border-blue-200',
    Done: 'bg-teal-50 text-teal-700 border-teal-200',
    'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
    Planned: 'bg-gray-100 text-gray-600 border-gray-200',
    Overdue: 'bg-red-50 text-red-700 border-red-200',
    Cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
    Active: 'bg-amber-50 text-amber-700 border-amber-200',
    Completed: 'bg-teal-50 text-teal-700 border-teal-200',
    Open: 'bg-blue-50 text-blue-700 border-blue-200',
    Offering: 'bg-purple-50 text-purple-700 border-purple-200',
    Hired: 'bg-teal-50 text-teal-700 border-teal-200',
    'On Hold': 'bg-gray-100 text-gray-600 border-gray-200',
  }
  return m[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'
}

// Parse Excel serial date to JS Date string
export function parseExcelDate(val: number | string): string {
  if (typeof val === 'string') return val
  const d = new Date((val - 25569) * 86400 * 1000)
  return format(d, 'yyyy-MM-dd')
}
