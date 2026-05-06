'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, UserPlus, UserMinus,
  GraduationCap, TrendingDown, CalendarDays,
  BarChart2, Heart, DollarSign, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard',   label: 'Dashboard',       icon: LayoutDashboard },
  { label: 'Analytics', section: true },
  { href: '/workforce',   label: 'Workforce',        icon: Users },
  { href: '/recruitment', label: 'Recruitment',      icon: UserPlus,    badge: '3' },
  { href: '/turnover',    label: 'Turnover',         icon: TrendingDown, badge: '!', badgeRed: true },
  { href: '/attendance',  label: 'Attendance',       icon: CalendarDays },
  { href: '/performance', label: 'Performance',      icon: BarChart2 },
  { href: '/learning',    label: 'Learning & Dev',   icon: GraduationCap, badge: '2', badgeRed: true },
  { href: '/engagement',  label: 'Engagement',       icon: Heart },
  { href: '/payroll',     label: 'Payroll',          icon: DollarSign },
]

export default function Sidebar() {
  const path = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/login', { method: 'DELETE' })
    router.push('/login')
  }

  return (
    <aside className="w-[210px] bg-navy-800 fixed top-0 left-0 bottom-0 flex flex-col z-50 overflow-y-auto">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-white/8 flex items-center gap-2.5 flex-shrink-0">
        <div className="w-8 h-8 bg-teal-400 rounded-xl flex items-center justify-center
                        text-navy-800 font-extrabold text-[10px] flex-shrink-0">
          5758
        </div>
        <div>
          <div className="text-white text-[12px] font-bold leading-tight">HC Dashboard</div>
          <div className="text-white/28 text-[9.5px] mt-0.5">Creative Lab · 2026</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {nav.map((item, i) => {
          if ('section' in item) {
            return (
              <div key={i} className="text-[9px] font-bold uppercase tracking-[.1em]
                                      text-white/20 px-4 pt-4 pb-1.5">
                {item.label}
              </div>
            )
          }
          const active = path === item.href || (item.href !== '/dashboard' && path.startsWith(item.href!))
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn('sb-item', active && 'active')}
            >
              <item.icon size={14} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className={cn(
                  'text-[9px] font-extrabold px-1.5 py-0.5 rounded-full',
                  item.badgeRed ? 'bg-red-500 text-white' : 'bg-teal-400 text-navy-800'
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Support CTA */}
      <div className="mx-3 mb-3 bg-white/[.05] border border-white/8 rounded-xl p-4 text-center">
        <div className="text-2xl mb-2">👥</div>
        <div className="text-white text-[11px] font-bold mb-1">Support 24/7</div>
        <div className="text-white/30 text-[9.5px] mb-3">Hubungi tim IT kapanpun</div>
        <button className="w-full bg-teal-400 hover:bg-teal-300 text-navy-800 font-bold
                           text-[10.5px] py-1.5 rounded-lg transition-colors">
          Mulai chat
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/8 flex-shrink-0">
        <button
          onClick={logout}
          className="flex items-center gap-2 text-white/30 hover:text-red-400
                     text-[11.5px] transition-colors w-full"
        >
          <LogOut size={13} />
          Keluar
        </button>
      </div>
    </aside>
  )
}
