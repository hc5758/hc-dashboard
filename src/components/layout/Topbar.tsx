'use client'
import { Bell, Search } from 'lucide-react'

interface TopbarProps {
  title: string
  subtitle?: string
  right?: React.ReactNode
}

export default function Topbar({ title, subtitle, right }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-navy-100
                        px-6 h-[52px] flex items-center gap-3 flex-shrink-0">
      <div className="flex items-center gap-2 flex-1">
        <h1 className="text-[14px] font-extrabold text-navy-800">{title}</h1>
        {subtitle && (
          <span className="text-[10px] font-bold bg-teal-50 text-teal-700
                           border border-teal-200 px-2 py-0.5 rounded-full">
            {subtitle}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {right}
        <div className="flex items-center gap-1.5 bg-navy-50 border border-navy-100
                         rounded-lg px-2.5 py-1.5 w-44">
          <Search size={12} className="text-navy-400 flex-shrink-0" />
          <input
            placeholder="Cari karyawan..."
            className="bg-transparent text-[11.5px] text-navy-800 placeholder:text-navy-400
                       outline-none w-full"
          />
        </div>
        <button className="relative p-1.5 text-navy-400 hover:text-navy-800 transition-colors">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-navy-800 flex items-center justify-center
                        text-teal-300 font-extrabold text-[10px] border-2 border-teal-400 cursor-pointer">
          AH
        </div>
      </div>
    </header>
  )
}
