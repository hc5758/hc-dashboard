'use client'
import { Search, Plus, Bell } from 'lucide-react'
import { useState } from 'react'
import { getCurrentQuarter } from '@/lib/utils'

interface TopbarProps {
  title: string
  onAddClick?: () => void
  addLabel?: string
  children?: React.ReactNode
}

export default function Topbar({ title, onAddClick, addLabel = 'Tambah data', children }: TopbarProps) {
  const [search, setSearch] = useState('')
  const quarter = getCurrentQuarter()

  return (
    <header className="bg-white border-b border-[#e2e8f4] px-5 py-2.5 flex items-center
                        justify-between sticky top-0 z-20 flex-shrink-0">
      <div className="flex items-center gap-2">
        <h1 className="text-[13.5px] font-bold text-[#0f1e3d]">{title}</h1>
        <span className="text-[9.5px] text-teal-700 bg-teal-50 border border-teal-200
                          px-2 py-0.5 rounded-full font-semibold">
          {quarter} · 2026
        </span>
      </div>

      <div className="flex items-center gap-2">
        {children}
        <div className="flex items-center gap-1.5 bg-[#f2f5fb] border border-[#e2e8f4]
                         rounded-lg px-2.5 py-1.5 w-44">
          <Search size={11} className="text-[#96a4be] flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari karyawan..."
            className="bg-transparent text-[11px] text-[#0f1e3d] placeholder:text-[#96a4be]
                        outline-none w-full"
          />
        </div>
        <button className="relative p-1.5 text-[#96a4be] hover:text-[#0f1e3d] transition-colors">
          <Bell size={15} />
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        </button>
        {onAddClick && (
          <button onClick={onAddClick} className="btn-primary">
            <Plus size={11} />
            {addLabel}
          </button>
        )}
      </div>
    </header>
  )
}
