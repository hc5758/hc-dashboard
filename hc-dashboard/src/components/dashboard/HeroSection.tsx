'use client'
import { DashboardStats } from '@/types'
import Link from 'next/link'

export default function HeroSection({ stats }: { stats: DashboardStats }) {
  return (
    <div className="bg-[#0f1e3d] rounded-2xl overflow-hidden grid grid-cols-2 min-h-[148px]">
      <div className="p-5 flex flex-col justify-center">
        <div className="inline-flex items-center gap-1.5 bg-teal-500/12 border border-teal-500/20
                         text-teal-400 text-[9.5px] font-bold px-2.5 py-1 rounded-full mb-3 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block"></span>
          Portal Internal · HC 2026
        </div>
        <h2 className="text-white text-[18px] font-bold leading-tight mb-1.5">
          Selamat datang,{' '}
          <span className="text-teal-400">Admin HR</span>
          <br />5758 Creative Lab
        </h2>
        <p className="text-white/35 text-[10.5px] leading-relaxed mb-3 max-w-xs">
          Data realtime seluruh karyawan, pipeline, cuti, kontrak, dan training tersedia di satu layar.
        </p>
        <div className="flex gap-2">
          <Link href="/offboarding"
            className="bg-teal-500 text-[#0f1e3d] text-[11px] font-bold px-3.5 py-1.5
                        rounded-lg hover:bg-teal-400 transition-colors">
            Laporan Q1 2026
          </Link>
          <Link href="/karyawan"
            className="bg-white/8 text-white/55 border border-white/10 text-[11px]
                        px-3.5 py-1.5 rounded-lg hover:bg-white/12 transition-colors">
            Data karyawan
          </Link>
        </div>
      </div>

      <div className="bg-white/3 border-l border-white/7 grid grid-cols-3">
        {[
          { num: stats.total_active, label: 'Total aktif', sub: 'Semua entitas', color: 'text-teal-400' },
          { num: stats.total_pkwtt, label: 'Kary. tetap', sub: 'PKWTT', color: 'text-blue-300' },
          { num: stats.resign_qtd + stats.end_contract_qtd, label: 'Resign + End OC', sub: 'Q1 2026', color: 'text-red-400' },
        ].map((s, i) => (
          <div key={i} className="p-4 border-r border-white/6 last:border-0 flex flex-col justify-center">
            <div className={`text-[26px] font-black leading-none ${s.color}`}>{s.num}</div>
            <div className="text-white/35 text-[9.5px] mt-1.5">{s.label}</div>
            <div className="text-white/20 text-[9px] mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
