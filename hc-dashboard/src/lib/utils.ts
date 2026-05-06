import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInMonths, differenceInDays, format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'd MMM yyyy', { locale: id })
  } catch {
    return '-'
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function calcYoS(joinDate: string): string {
  if (!joinDate) return '-'
  const join = parseISO(joinDate)
  const now = new Date()
  const months = differenceInMonths(now, join)
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  if (years === 0) return `${remainingMonths} Bulan`
  if (remainingMonths === 0) return `${years} Tahun`
  return `${years} Thn ${remainingMonths} Bln`
}

export function calcYoSDecimal(joinDate: string): number {
  if (!joinDate) return 0
  const join = parseISO(joinDate)
  const months = differenceInMonths(new Date(), join)
  return parseFloat((months / 12).toFixed(2))
}

export function daysUntil(date: string | null | undefined): number {
  if (!date) return 9999
  return differenceInDays(parseISO(date), new Date())
}

export function getCurrentQuarter(): string {
  const month = new Date().getMonth() + 1
  if (month <= 3) return 'Q1'
  if (month <= 6) return 'Q2'
  if (month <= 9) return 'Q3'
  return 'Q4'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

export function getAvatarColor(name: string): string {
  const colors = [
    'bg-teal-100 text-teal-800',
    'bg-blue-100 text-blue-800',
    'bg-purple-100 text-purple-800',
    'bg-orange-100 text-orange-800',
    'bg-pink-100 text-pink-800',
    'bg-indigo-100 text-indigo-800',
  ]
  const index = name.charCodeAt(0) % colors.length
  return colors[index]
}

export function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    active: 'bg-teal-50 text-teal-800 border border-teal-200',
    inactive: 'bg-gray-100 text-gray-600',
    resigned: 'bg-red-50 text-red-800 border border-red-200',
    end_contract: 'bg-blue-50 text-blue-800 border border-blue-200',
    Done: 'bg-teal-50 text-teal-800 border border-teal-200',
    'In Progress': 'bg-blue-50 text-blue-800 border border-blue-200',
    Planned: 'bg-gray-100 text-gray-600',
    Overdue: 'bg-red-50 text-red-800 border border-red-200',
    Cancelled: 'bg-gray-100 text-gray-500',
    Active: 'bg-orange-50 text-orange-800 border border-orange-200',
    Completed: 'bg-teal-50 text-teal-800',
    Open: 'bg-blue-50 text-blue-800 border border-blue-200',
    Hired: 'bg-teal-50 text-teal-800',
    Offering: 'bg-purple-50 text-purple-800',
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}

export function parseExcelDate(excelDate: number | string): string {
  if (typeof excelDate === 'string') return excelDate
  const date = new Date((excelDate - 25569) * 86400 * 1000)
  return format(date, 'yyyy-MM-dd')
}
