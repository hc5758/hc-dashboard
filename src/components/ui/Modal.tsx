'use client'
import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ title, children, onClose, size = 'md' }: {
  title: string; children: React.ReactNode; onClose: () => void; size?: 'sm' | 'md' | 'lg'
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const maxW = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }[size]
  return (
    <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-xl w-full ${maxW} max-h-[88vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100 flex-shrink-0">
          <h2 className="text-[14px] font-extrabold text-navy-800">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-navy-50 hover:bg-navy-100 flex items-center justify-center text-navy-400">
            <X size={14} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}
