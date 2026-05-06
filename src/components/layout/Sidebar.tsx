'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, UserPlus, TrendingDown, CalendarDays, BarChart2, GraduationCap, Heart, DollarSign, LogOut, Settings, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard',   label: 'Dashboard',      icon: LayoutDashboard },
  { section: 'Data SDM' },
  { href: '/workforce',   label: 'Workforce',      icon: Users },
  { href: '/recruitment', label: 'Recruitment',    icon: UserPlus,      badge: '3', badgeColor: 'bg-teal-100 text-teal-700' },
  { href: '/turnover',    label: 'Turnover',       icon: TrendingDown,  badge: '!', badgeColor: 'bg-red-100 text-red-600' },
  { href: '/attendance',  label: 'Manajemen Cuti', icon: CalendarDays },
  { section: 'Pengembangan' },
  { href: '/performance', label: 'Performance',    icon: BarChart2 },
  { href: '/learning',    label: 'Learning & Dev', icon: GraduationCap, badge: '2', badgeColor: 'bg-red-100 text-red-600' },
  { href: '/engagement',  label: 'Engagement',     icon: Heart },
  { section: 'Keuangan' },
  { href: '/payroll',     label: 'Payroll',        icon: DollarSign },
]

export default function Sidebar() {
  const path   = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/login', { method: 'DELETE' })
    router.push('/login')
  }

  return (
    <aside className="w-[210px] bg-white border-r border-slate-200 fixed top-0 left-0 bottom-0 flex flex-col z-50 overflow-y-auto">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-slate-100 flex items-center gap-2.5 flex-shrink-0">
        <div className="w-8 h-8 bg-[#0f1e3d] rounded-xl flex items-center justify-center text-teal-300 font-bold text-[10px] flex-shrink-0">
          5758
        </div>
        <div>
          <div className="text-[12.5px] font-semibold text-slate-800 leading-tight">HC Dashboard</div>
          <div className="text-[10px] text-slate-400 mt-0.5">5758 Creative Lab</div>
        </div>
      </div>

      <nav className="flex-1 py-3">
        {nav.map((item, i) => {
          if ('section' in item) {
            return (
              <div key={i} className="text-[9.5px] font-semibold uppercase tracking-widest text-slate-400 px-4 pt-4 pb-1.5">
                {item.section}
              </div>
            )
          }
          const active = path === item.href || (item.href !== '/dashboard' && path.startsWith(item.href!))
          return (
            <Link key={item.href} href={item.href!} className={cn('sb-item', active && 'active')}>
              <item.icon size={15} className="flex-shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', item.badgeColor)}>{item.badge}</span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t border-slate-100 flex-shrink-0 space-y-1">
        <Link href="/settings" className="sb-item rounded-lg">
          <Settings size={15} /> Pengaturan
        </Link>
        <button onClick={logout} className="sb-item w-full rounded-lg hover:text-red-500 hover:bg-red-50">
          <LogOut size={15} /> Keluar
        </button>
      </div>
    </aside>
  )
}
