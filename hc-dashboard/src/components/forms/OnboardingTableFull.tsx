'use client'
import { useState } from 'react'
import { formatDate } from '@/lib/utils'
import { Plus, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const CHECKLIST_COLS = [
  { key: 'update_to_structure', label: 'Struct' },
  { key: 'send_job_description', label: 'JD' },
  { key: 'session_1', label: 'S1' },
  { key: 'session_2', label: 'S2' },
  { key: 'session_3', label: 'S3' },
  { key: 'session_4', label: 'S4' },
]

export default function OnboardingTableFull({ records: initial, employees, admins }: {
  records: any[]; employees: any[]; admins: any[]
}) {
  const [records, setRecords] = useState(initial)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    employee_id: '', pic_id: '', quarter: 'Q2', year: 2024,
    hiring_source: 'Job Portal', placement_location: '',
  })

  const filtered = records.filter(r =>
    !search ||
    r.employee?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.employee?.division?.toLowerCase().includes(search.toLowerCase())
  )

  async function toggleCheck(id: string, field: string, val: boolean) {
    const supabase = createClient()
    const updates: Record<string, any> = { [field]: val }
    if (val && field.startsWith('session_') && !field.includes('date') && !field.includes('notes')) {
      updates[`${field}_date`] = new Date().toISOString().split('T')[0]
    }
    await supabase.from('onboarding').update(updates).eq('id', id)
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
  }

  async function handleSave() {
    if (!form.employee_id) return
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('onboarding')
      .insert({ ...form, year: Number(form.year) })
      .select('*, employee:employees(*), pic:admin_users(full_name)')
      .single()
    if (!error && data) {
      setRecords(prev => [data, ...prev])
      setShowForm(false)
    }
    setSaving(false)
  }

  const stats = {
    total: records.length,
    completed: records.filter(r => r.is_completed).length,
    inProgress: records.filter(r => !r.is_completed && r.session_1).length,
    notStarted: records.filter(r => !r.is_completed && !r.session_1).length,
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2.5">
        {[
          { label: 'Total onboarding', val: stats.total, color: 'text-[#0f1e3d]' },
          { label: 'Selesai', val: stats.completed, color: 'text-teal-700' },
          { label: 'Sedang berjalan', val: stats.inProgress, color: 'text-blue-700' },
          { label: 'Belum mulai', val: stats.notStarted, color: 'text-amber-700' },
        ].map((s, i) => (
          <div key={i} className="card p-3">
            <div className={`text-[22px] font-black ${s.color}`}>{s.val}</div>
            <div className="text-[10px] text-[#5a6a8a] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-white border border-[#e2e8f4] rounded-lg px-2.5 py-1.5 flex-1 max-w-xs">
          <Search size={11} className="text-[#96a4be]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari karyawan..." className="bg-transparent text-[11px] outline-none w-full placeholder:text-[#96a4be] text-[#0f1e3d]" />
        </div>
        <div className="ml-auto">
          <button onClick={() => setShowForm(!showForm)} className="btn-teal">
            <Plus size={11} />Tambah karyawan baru
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card p-4 border-l-4 border-teal-500">
          <div className="text-[12px] font-bold mb-3">Input onboarding karyawan baru</div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-[#5a6a8a] font-medium block mb-1">Karyawan *</label>
              <select value={form.employee_id} onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))} className="input-field">
                <option value="">Pilih karyawan...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} — {e.division}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#5a6a8a] font-medium block mb-1">PIC (HR)</label>
              <select value={form.pic_id} onChange={e => setForm(p => ({ ...p, pic_id: e.target.value }))} className="input-field">
                <option value="">Pilih PIC...</option>
                {admins.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#5a6a8a] font-medium block mb-1">Quartal</label>
              <select value={form.quarter} onChange={e => setForm(p => ({ ...p, quarter: e.target.value }))} className="input-field">
                {['Q1','Q2','Q3','Q4'].map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#5a6a8a] font-medium block mb-1">Hiring source</label>
              <select value={form.hiring_source} onChange={e => setForm(p => ({ ...p, hiring_source: e.target.value }))} className="input-field">
                {['Job Portal','LinkedIn','Referral','Internal','Headhunter','Walk-in'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#5a6a8a] font-medium block mb-1">Lokasi penempatan</label>
              <input value={form.placement_location} onChange={e => setForm(p => ({ ...p, placement_location: e.target.value }))}
                placeholder="Jakarta" className="input-field" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleSave} disabled={saving} className="btn-teal">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Batal</button>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full" style={{ minWidth: '700px', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th className="table-th w-[30px]">No</th>
              <th className="table-th w-[60px]">PIC</th>
              <th className="table-th w-[120px]">Nama karyawan</th>
              <th className="table-th w-[80px]">Posisi</th>
              <th className="table-th w-[75px]">Divisi</th>
              <th className="table-th w-[75px]">Work location</th>
              <th className="table-th w-[45px]">Q</th>
              <th className="table-th w-[80px]">Hiring source</th>
              {CHECKLIST_COLS.map(c => (
                <th key={c.key} className="table-th w-[45px] text-center">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, idx) => (
              <tr key={r.id} className="hover:bg-[#fafbfe]">
                <td className="table-td text-[#96a4be]">{idx + 1}</td>
                <td className="table-td text-[10px] text-[#5a6a8a]">{r.pic?.full_name?.split(' ')[0] || '–'}</td>
                <td className="table-td font-semibold truncate">{r.employee?.full_name}</td>
                <td className="table-td text-[10px] truncate">{r.employee?.position}</td>
                <td className="table-td text-[10px] text-[#5a6a8a] truncate">{r.employee?.division}</td>
                <td className="table-td text-[10px] text-[#5a6a8a]">{r.placement_location || 'Jakarta'}</td>
                <td className="table-td">
                  <span className={`badge ${r.quarter === 'Q1' ? 'badge-blue' : 'badge-teal'}`}>{r.quarter}</span>
                </td>
                <td className="table-td text-[10px] text-[#5a6a8a] truncate">{r.hiring_source}</td>
                {CHECKLIST_COLS.map(c => (
                  <td key={c.key} className="table-td text-center">
                    <button
                      onClick={() => toggleCheck(r.id, c.key, !r[c.key])}
                      className={`w-5 h-5 rounded text-[9px] font-bold border transition-colors
                        ${r[c.key]
                          ? 'bg-teal-50 text-teal-700 border-teal-200'
                          : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                        }`}
                    >{r[c.key] ? '✓' : '–'}</button>
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={9 + CHECKLIST_COLS.length} className="table-td text-center py-6 text-[#96a4be]">
                Belum ada data onboarding
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
