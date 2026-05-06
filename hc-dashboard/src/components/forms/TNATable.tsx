'use client'
import { useState } from 'react'
import { TNARecord, Employee } from '@/types'
import { formatDate, getStatusBadgeClass } from '@/lib/utils'
import { Plus, Search, Download, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props { records: any[]; employees: any[] }

const STATUS_COLORS: Record<string, string> = {
  Done: 'badge-teal', 'In Progress': 'badge-blue', Planned: 'badge-gray',
  Overdue: 'badge-red', Cancelled: 'badge-gray',
}

export default function TNATable({ records: initial, employees }: Props) {
  const [records, setRecords] = useState(initial)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    employee_id: '', training_name: '', training_category: 'Hard Skill',
    training_method: 'Online', quarter: 'Q2', year: 2024,
    target_date: '', status: 'Planned', notes: '',
  })

  const filtered = records.filter(r => {
    const matchSearch = !search ||
      r.employee?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.training_name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || r.status === filterStatus
    return matchSearch && matchStatus
  })

  // Summary stats
  const stats = {
    total: records.length,
    done: records.filter(r => r.status === 'Done').length,
    inProgress: records.filter(r => r.status === 'In Progress').length,
    overdue: records.filter(r => r.status === 'Overdue').length,
    planned: records.filter(r => r.status === 'Planned').length,
  }

  async function handleSave() {
    if (!form.employee_id || !form.training_name) return
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('tna_records')
      .insert({ ...form, year: Number(form.year) })
      .select('*, employee:employees(full_name, division)')
      .single()
    if (!error && data) {
      setRecords(prev => [data, ...prev])
      setShowForm(false)
      setForm({ employee_id: '', training_name: '', training_category: 'Hard Skill',
        training_method: 'Online', quarter: 'Q2', year: 2024, target_date: '', status: 'Planned', notes: '' })
    }
    setSaving(false)
  }

  async function updateStatus(id: string, status: string) {
    const supabase = createClient()
    await supabase.from('tna_records').update({ status }).eq('id', id)
    setRecords(prev => prev.map(r => r.id === id ? { ...r, status } : r))
  }

  // Progress per employee
  const byEmployee = employees.map(e => {
    const empR = records.filter(r => r.employee_id === e.id)
    const done = empR.filter(r => r.status === 'Done').length
    const pct = empR.length > 0 ? Math.round((done / empR.length) * 100) : 0
    return { ...e, total: empR.length, done, pct }
  }).filter(e => e.total > 0).sort((a, b) => b.pct - a.pct)

  return (
    <div className="space-y-4">
      {/* Summary KPI */}
      <div className="grid grid-cols-5 gap-2.5">
        {[
          { label: 'Total TNA', val: stats.total, color: 'text-[#0f1e3d]', bg: 'bg-white' },
          { label: 'Selesai', val: stats.done, color: 'text-teal-700', bg: 'bg-teal-50' },
          { label: 'In Progress', val: stats.inProgress, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Overdue', val: stats.overdue, color: 'text-red-700', bg: 'bg-red-50' },
          { label: 'Planned', val: stats.planned, color: 'text-gray-600', bg: 'bg-gray-50' },
        ].map((s, i) => (
          <div key={i} className={`card ${s.bg} p-3`}>
            <div className={`text-[22px] font-black ${s.color}`}>{s.val}</div>
            <div className="text-[10px] text-[#5a6a8a] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left: Progress bars */}
        <div className="card p-4">
          <div className="text-[11.5px] font-bold text-[#0f1e3d] mb-3">Progress per karyawan</div>
          <div className="space-y-3">
            {byEmployee.slice(0, 8).map(e => (
              <div key={e.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-[#0f1e3d]">
                    {e.full_name.split(' ').slice(0, 2).join(' ')}
                  </span>
                  <span className={`text-[10px] font-bold ${e.pct === 100 ? 'text-teal-700' : e.pct >= 60 ? 'text-blue-600' : 'text-amber-600'}`}>
                    {e.pct}%
                  </span>
                </div>
                <div className="h-1.5 bg-[#f0f3fa] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${e.pct === 100 ? 'bg-teal-500' : e.pct >= 60 ? 'bg-blue-400' : 'bg-amber-400'}`}
                       style={{ width: `${e.pct}%` }} />
                </div>
                <div className="text-[9px] text-[#96a4be] mt-0.5">{e.done}/{e.total} training</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Table */}
        <div className="col-span-2 space-y-3">
          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-[#e2e8f4] rounded-lg px-2.5 py-1.5 flex-1">
              <Search size={11} className="text-[#96a4be]" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cari karyawan atau training..."
                className="bg-transparent text-[11px] outline-none w-full placeholder:text-[#96a4be] text-[#0f1e3d]" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="text-[11px] bg-white border border-[#e2e8f4] rounded-lg px-2.5 py-1.5 outline-none text-[#0f1e3d]">
              <option value="all">Semua status</option>
              {['Done', 'In Progress', 'Planned', 'Overdue', 'Cancelled'].map(s =>
                <option key={s} value={s}>{s}</option>
              )}
            </select>
            <button onClick={() => setShowForm(!showForm)} className="btn-teal">
              <Plus size={11} />Input TNA
            </button>
          </div>

          {/* Add Form */}
          {showForm && (
            <div className="card p-4 border-l-4 border-teal-500">
              <div className="text-[12px] font-bold text-[#0f1e3d] mb-3">Input TNA baru</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#5a6a8a] font-medium block mb-1">Karyawan *</label>
                  <select value={form.employee_id} onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))}
                    className="input-field">
                    <option value="">Pilih karyawan...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} — {e.division}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#5a6a8a] font-medium block mb-1">Nama Training *</label>
                  <input value={form.training_name} onChange={e => setForm(p => ({ ...p, training_name: e.target.value }))}
                    placeholder="e.g. Leadership Basics" className="input-field" />
                </div>
                <div>
                  <label className="text-[10px] text-[#5a6a8a] font-medium block mb-1">Kategori</label>
                  <select value={form.training_category} onChange={e => setForm(p => ({ ...p, training_category: e.target.value }))}
                    className="input-field">
                    {['Hard Skill','Soft Skill','Leadership','Technical','Compliance','Others'].map(c =>
                      <option key={c} value={c}>{c}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#5a6a8a] font-medium block mb-1">Metode</label>
                  <select value={form.training_method} onChange={e => setForm(p => ({ ...p, training_method: e.target.value }))}
                    className="input-field">
                    {['Online','Offline','Hybrid','Self-learning'].map(m =>
                      <option key={m} value={m}>{m}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#5a6a8a] font-medium block mb-1">Target tanggal</label>
                  <input type="date" value={form.target_date} onChange={e => setForm(p => ({ ...p, target_date: e.target.value }))}
                    className="input-field" />
                </div>
                <div>
                  <label className="text-[10px] text-[#5a6a8a] font-medium block mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    className="input-field">
                    {['Planned','In Progress','Done','Overdue'].map(s =>
                      <option key={s} value={s}>{s}</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="mt-3">
                <label className="text-[10px] text-[#5a6a8a] font-medium block mb-1">Catatan</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2} className="input-field resize-none" placeholder="Catatan tambahan..." />
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={handleSave} disabled={saving} className="btn-teal">
                  {saving ? 'Menyimpan...' : 'Simpan TNA'}
                </button>
                <button onClick={() => setShowForm(false)} className="btn-secondary">Batal</button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="card overflow-x-auto">
            <table className="w-full" style={{ tableLayout: 'fixed', minWidth: '600px' }}>
              <thead>
                <tr>
                  <th className="table-th w-[120px]">Karyawan</th>
                  <th className="table-th">Training</th>
                  <th className="table-th w-[80px]">Kategori</th>
                  <th className="table-th w-[70px]">Metode</th>
                  <th className="table-th w-[85px]">Target</th>
                  <th className="table-th w-[80px]">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-[#fafbfe]">
                    <td className="table-td">
                      <div className="font-semibold truncate text-[11px]">{r.employee?.full_name?.split(' ').slice(0,2).join(' ')}</div>
                      <div className="text-[9px] text-[#96a4be]">{r.employee?.division}</div>
                    </td>
                    <td className="table-td font-medium truncate">{r.training_name}</td>
                    <td className="table-td">
                      <span className="badge badge-gray text-[8.5px]">{r.training_category}</span>
                    </td>
                    <td className="table-td text-[10px] text-[#5a6a8a]">{r.training_method}</td>
                    <td className="table-td text-[10px] text-[#5a6a8a]">{formatDate(r.target_date)}</td>
                    <td className="table-td">
                      <select
                        value={r.status}
                        onChange={e => updateStatus(r.id, e.target.value)}
                        className={`badge border-0 cursor-pointer outline-none ${STATUS_COLORS[r.status] || 'badge-gray'}`}
                        style={{ appearance: 'none', padding: '2px 8px' }}
                      >
                        {['Planned','In Progress','Done','Overdue','Cancelled'].map(s =>
                          <option key={s} value={s}>{s}</option>
                        )}
                      </select>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="table-td text-center py-6 text-[#96a4be]">Belum ada data TNA</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
