'use client'
import { Trash2 } from 'lucide-react'

interface BulkBarProps {
  count: number
  onDelete: () => void
  deleting?: boolean
  label?: string
}

export default function BulkBar({ count, onDelete, deleting, label = 'data' }: BulkBarProps) {
  if (count === 0) return null
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
      <span className="text-[11.5px] font-semibold text-red-700">{count} dipilih</span>
      <button onClick={onDelete} disabled={deleting}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600 text-white rounded-md text-[11px] font-semibold hover:bg-red-700 transition-colors disabled:opacity-50">
        <Trash2 size={11}/>
        {deleting ? 'Menghapus...' : `Hapus ${count} ${label}`}
      </button>
    </div>
  )
}
