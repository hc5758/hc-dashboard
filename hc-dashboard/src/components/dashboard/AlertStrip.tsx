'use client'
import { DashboardStats } from '@/types'
import { AlertTriangle, Clock, GraduationCap, Star } from 'lucide-react'

export default function AlertStrip({ stats }: { stats: DashboardStats }) {
  const alerts = [
    {
      count: stats.contracts_expiring_soon,
      label: 'Kontrak PKWT habis',
      sub: '< 30 hari ke depan',
      color: 'bg-red-50 border-red-400',
      numColor: 'text-red-700',
      iconBg: 'bg-red-100',
      tag: 'URGENT',
      tagColor: 'text-red-600',
      icon: AlertTriangle,
    },
    {
      count: stats.probation_ending,
      label: 'Masa probasi selesai',
      sub: 'Perlu review & keputusan',
      color: 'bg-amber-50 border-amber-400',
      numColor: 'text-amber-700',
      iconBg: 'bg-amber-100',
      tag: 'REVIEW',
      tagColor: 'text-amber-600',
      icon: Clock,
    },
    {
      count: stats.tna_overdue,
      label: 'TNA / training overdue',
      sub: 'Melewati target deadline',
      color: 'bg-blue-50 border-blue-400',
      numColor: 'text-blue-700',
      iconBg: 'bg-blue-100',
      tag: 'OVERDUE',
      tagColor: 'text-blue-600',
      icon: GraduationCap,
    },
    {
      count: stats.pip_active,
      label: 'PIP / SP sedang berjalan',
      sub: 'Monitor progress rutin',
      color: 'bg-teal-50 border-teal-400',
      numColor: 'text-teal-700',
      iconBg: 'bg-teal-100',
      tag: 'AKTIF',
      tagColor: 'text-teal-600',
      icon: Star,
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {alerts.map((a, i) => (
        <div key={i} className={`${a.color} border-l-4 rounded-lg p-3`}>
          <div className="flex items-center justify-between mb-2">
            <div className={`${a.iconBg} w-7 h-7 rounded-lg flex items-center justify-center`}>
              <a.icon size={13} className={a.numColor} />
            </div>
            <span className={`text-[9px] font-bold ${a.tagColor}`}>{a.tag}</span>
          </div>
          <div className={`text-2xl font-black ${a.numColor} leading-none mb-1`}>{a.count}</div>
          <div className="text-[10.5px] text-gray-600 leading-tight">{a.label}</div>
          <div className={`text-[9.5px] font-semibold ${a.numColor} mt-1`}>{a.sub}</div>
        </div>
      ))}
    </div>
  )
}
