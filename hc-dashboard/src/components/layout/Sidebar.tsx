'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, FileText, Star, AlertTriangle,
  UserPlus, UserMinus, GraduationCap, DollarSign, BarChart2,
  Link2, LogOut, ChevronRight
} from 'lucide-react'

const navItems = [
  { section: 'Overview', items: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ]},
  { section: 'Karyawan', items: [
    { href: '/karyawan', label: 'Data karyawan', icon: Users },
    { href: '/karyawan/kontrak', label: 'Kontrak & status', icon: FileText },
    { href: '/karyawan/promosi', label: 'Acting / promosi', icon: Star },
    { href: '/karyawan/pip', label: 'PIP / SP', icon: AlertTriangle, badge: '2', badgeRed: true },
  ]},
  { section: 'Proses HR', items: [
    { href: '/recruitment', label: 'Recruitment', icon: UserPlus, badge: '3' },
    { href: '/onboarding', label: 'Onboarding', icon: UserPlus },
    { href: '/offboarding', label: 'Offboarding', icon: UserMinus, badge: '5', badgeRed: true },
    { href: '/tna', label: 'TNA tracker', icon: GraduationCap, badge: '2', badgeRed: true },
  ]},
  { section: 'Laporan', items: [
    { href: '/salary', label: 'Total salary', icon: DollarSign },
    { href: '/salary/performance', label: 'Performance', icon: BarChart2 },
    { href: '/hcthings', label: 'HC Things', icon: Link2 },
  ]},
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-[196px] bg-[#0f1e3d] flex flex-col flex-shrink-0 min-h-screen">
      {/* Brand */}
      <div className="px-3.5 py-4 border-b border-white/8 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center
                        text-[#0f1e3d] font-black text-[11px] flex-shrink-0">
          5758
        </div>
        <div>
          <div className="text-white text-[11.5px] font-semibold leading-tight">Portal Internal HC</div>
          <div className="text-white/30 text-[9.5px]">Creative Lab · 2026</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map(section => (
          <div key={section.section} className="mb-1">
            <div className="text-white/22 text-[8.5px] font-bold uppercase tracking-widest
                            px-3.5 py-2 mt-1">
              {section.section}
            </div>
            {section.items.map(item => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-[7px] text-[11px]
                              border-l-2 transition-all duration-150
                              ${isActive
                                ? 'text-teal-400 bg-teal-900/20 border-teal-500'
                                : 'text-white/42 border-transparent hover:text-white/75 hover:bg-white/4'
                              }`}>
                  <item.icon size={13} className="flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-full
                      ${item.badgeRed ? 'bg-red-500 text-white' : 'bg-teal-500 text-[#0f1e3d]'}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3.5 py-3 border-t border-white/8">
        <button onClick={handleLogout}
          className="flex items-center gap-2 w-full text-white/35 hover:text-red-400
                     text-[11px] transition-colors py-1">
          <LogOut size={12} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  )
}
