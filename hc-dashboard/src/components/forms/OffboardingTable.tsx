'use client'
import { useState } from 'react'
import { formatDate, calcYoS } from '@/lib/utils'
import { Plus, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const CHECKLIST_FIELDS = [
  { key: 'return_assets', label: 'Aset/ID' },
  { key: 'clearance_letter', label: 'Clearance' },
  { key: 'exit_interview', label: 'Exit Int.' },
  { key: 'send_paklaring', label: 'Paklaring' },
  { key: 'bpjs_deactivated', label: 'BPJS' },
  { key: 'final_payment_done', label: 'Final Pay' },
]

export default function OffboardingTable({ records: initial, employees }: { records: any[]; employees: any[] }) {
  const [records, setRecords] = useState(initial)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    employee_id: '', report_date: '', quarter: 'Q1', year: 2024,
    offboard_type: 'Resign', effective_date: '', reason_to_leave: '',
  })

  const filtered = records.filter(r =>
    !search ||
    r.employee?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.offboard_type?.toLowerCase().includes(search.toLowerCase())
  )

  async function toggleChecklist(id: string, field: string, val: boolean) {
    const supabase = createClient()
    await supabase.from('offboarding').update({ [field]: val }).eq('id', id)
    setRecords(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r))
  }

  async function handleSave() {
    if (!form.employee_id || !form.report_date || !form.effective_date) return
    setSaving(true)
    const supabase = createClient()

    // Update employee status
    const status = form.offboard_type === 'End of Contract' ? 'end_contract' : 'resigned'
    await supabase.from('employees').update({ status }).eq('id', form.employee_id)

    const { data, error } = await supabase.from('offboarding')
      .insert({ ...form, year: Number(form.year) })
      .select('*, employee:employees(*)')
      .single()

    if (!error && data) {
      setRecords(prev => [data, ...prev])
      setShowForm(false)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-2.5">
        {[
          { label: 'Total keluar', val: records.length, color: 'text-[#0f1e3d]' },
          { label: 'Resign', val: records.filter(r => r.offboard_type === 'Resign').length, color: 'text-red-700' },
          { label: 'End of Contract', val: records.filter(r => r.offboard_type === 'End of Contract').length, color: 'text-blue-700' },
          { label: 'Clearance selesai', val: records.filter(r => r.clearance_letter && r.return_assets && r.exit_interview).length, color: 'text-teal-700' },
        ].map((s, i) => (
          <div key={i} className="card p-3">
            <div className={`text-[22px] font-black ${s.color}`}>{s.val}</div>
            <div className="text-[10px] text-[#5a6a8a] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-white border border-[#e2e8f4] rounded-lg px-2.5 py-1.5 flex-1 max-w-xs">
          <Search size={11} className="text-[#96a4be]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama karyawan..."
            className="bg-transparent text-[11px] outline-none w-full placeholder:text-[#96a4be] text-[#0f1e3d]" />
        </div>
        <div className="ml-auto">
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Plus size={11} />Tambah data keluar
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-4 border-l-4 border-red-400">
          <div className="text-[12px] font-bold text-[#0f1e3d] mb-3">Input data karyawan keluar</div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-[#5a6a8a] font-medium block mb-1">Karyawan *</label>
              <select value={form.employee_id} onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))}
                className="input-field">
                <option value="">Pilih karyawan...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} — {e.division}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#5a6a8a] font-medium block mb-1">Tipe keluar *</label>
              <select value={form.offboard_type} onChange={e => setForm(p => ({ ...p, offboard_type: e.target.value }))}
                className="input-field">
                {['Resign','End of Contract','Termination','Retirement'].map(t =>
                  <option key={t} value={t}>{t}</option>
                )}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#5a6a8a] font-medium block mb-1">Quartal</label>
              <select value={form.quarter} onChange={e => setForm(p => ({ ...p, quarter: e.target.value }))}
                className="input-field">
                {['Q1','Q2','Q3','Q4'].map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#5a6a8a] font-medium block mb-1">Report date *</label>
              <input type="date" value={form.report_date} onChange={e => setForm(p => ({ ...p, report_date: e.target.value }))}
                className="input-field" />
            </div>
            <div>
              <label className="text-[10px] text-[#5a6a8a] font-medium block mb-1">Effective date *</label>
              <input type="date" value={form.effective_date} onChange={e => setForm(p => ({ ...p, effective_date: e.target.value }))}
                className="input-field" />
            </div>
            <div>
              <label className="text-[10px] text-[#5a6a8a] font-medium block mb-1">Alasan keluar</label>
              <input value={form.reason_to_leave} onChange={e => setForm(p => ({ ...p, reason_to_leave: e.target.value }))}
                placeholder="e.g. Opportunity from other company" className="input-field" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Batal</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full" style={{ minWidth: '900px', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th className="table-th w-[80px]">Report date</th>
              <th className="table-th w-[35px]">Q</th>
              <th className="table-th w-[120px]">Nama</th>
              <th className="table-th w-[80px]">Divisi</th>
              <th className="table-th w-[75px]">Tgl bergabung</th>
              <th className="table-th w-[60px]">YoS</th>
              <th className="table-th w-[80px]">Eff. date</th>
              <th className="table-th w-[70px]">Tipe</th>
              <th className="table-th w-[120px]">Alasan</th>
              {CHECKLIST_FIELDS.map(f => (
                <th key={f.key} className="table-th w-[50px] text-center">{f.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-[#fafbfe]">
                <td className="table-td text-[#5a6a8a]">{formatDate(r.report_date)}</td>
                <td className="table-td">
                  <span className={`badge ${r.quarter === 'Q1' ? 'badge-blue' : 'badge-teal'}`}>{r.quarter}</span>
                </td>
                <td className="table-td font-semibold truncate">{r.employee?.full_name?.split(' ').slice(0,3).join(' ')}</td>
                <td className="table-td text-[#5a6a8a] truncate">{r.employee?.division}</td>
                <td className="table-td text-[#5a6a8a]">{formatDate(r.employee?.join_date)}</td>
                <td className="table-td text-[10px]">{calcYoS(r.employee?.join_date)}</td>
                <td className="table-td text-[#5a6a8a]">{formatDate(r.effective_date)}</td>
                <td className="table-td">
                  <span className={`badge ${r.offboard_type === 'Resign' ? 'badge-red' : 'badge-blue'}`}>
                    {r.offboard_type === 'End of Contract' ? 'End OC' : r.offboard_type}
                  </span>
                </td>
                <td className="table-td text-[10px] text-[#5a6a8a] truncate">{r.reason_to_leave || '–'}</td>
                {CHECKLIST_FIELDS.map(f => (
                  <td key={f.key} className="table-td text-center">
                    <button
                      onClick={() => toggleChecklist(r.id, f.key, !r[f.key])}
                      className={`w-5 h-5 rounded text-[9px] font-bold border transition-colors
                        ${r[f.key]
                          ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
                          : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
                        }`}
                    >
                      {r[f.key] ? '✓' : '–'}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={10 + CHECKLIST_FIELDS.length} className="table-td text-center py-6 text-[#96a4be]">
                Belum ada data offboarding
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
