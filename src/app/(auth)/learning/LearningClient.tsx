'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { KPICard, Badge, InsightCard, EmptyState, ProgressBar } from '@/components/ui'
import { fmtDate, cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

export default function LearningClient({ tna: init, employees }: { tna: any[]; employees: any[] }) {
  const [tna, setTna] = useState(init)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ employee_id: '', training_name: '', training_category: 'Hard Skill', training_method: 'Online', quarter: 'Q2', year: 2026, target_date: '', status: 'Planned' })

  const done = tna.filter(t => t.status === 'Done')
  const overdue = tna.filter(t => t.status === 'Overdue')

  const empProgress = employees.map(e => {
    const et = tna.filter(t => t.employee_id === e.id)
    const ed = et.filter(t => t.status === 'Done').length
    const pct = et.length > 0 ? Math.round(ed / et.length * 100) : 0
    return { ...e, total: et.length, done: ed, pct, hasOverdue: et.some(t => t.status === 'Overdue') }
  }).filter(e => e.total > 0).sort((a, b) => b.pct - a.pct)

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/tna?id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    setTna(p => p.map(t => t.id === id ? { ...t, status } : t))
  }

  async function saveTNA() {
    if (!form.employee_id || !form.training_name) return
    setSaving(true)
    const res = await fetch('/api/tna', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if (res.ok && data.data) {
      const emp = employees.find(e => e.id === form.employee_id)
      setTna(p => [{ ...data.data, employee: emp }, ...p])
      setShowModal(false)
    }
    setSaving(false)
  }

  async function delTNA(id: string) {
    if (!confirm('Hapus record TNA ini?')) return
    await fetch(`/api/tna?id=${id}`, { method: 'DELETE' })
    setTna(p => p.filter(t => t.id !== id))
  }

  const sc: Record<string, string> = { Done: 'teal', 'In Progress': 'blue', Planned: 'gray', Overdue: 'red', Cancelled: 'gray' }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-3">
        <KPICard label="Participation rate" value="78%"  change="vs 65% Q1" changeType="up"   accent="bg-teal-400" />
        <KPICard label="Completion rate"    value={tna.length > 0 ? `${Math.round(done.length / tna.length * 100)}%` : '0%'} change="target 80%" changeType="flat" accent="bg-blue-400" />
        <KPICard label="TNA overdue"        value={overdue.length} change={overdue.length > 0 ? 'perlu action' : 'aman'} changeType={overdue.length > 0 ? 'down' : 'flat'} accent="bg-red-400" />
        <KPICard label="Total training hrs" value={`${done.reduce((s, t) => s + (t.duration_hours ?? 8), 0)} hr`} change="YTD 2026" changeType="flat" accent="bg-purple-400" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <div className="card-head"><span className="card-title">Progress per karyawan</span></div>
          <div className="card-body space-y-3">
            {empProgress.map(e => (
              <div key={e.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11.5px] font-semibold text-navy-800">{e.full_name.split(' ').slice(0, 2).join(' ')}</span>
                  <span className={cn('text-[11px] font-extrabold', e.hasOverdue ? 'text-red-600' : e.pct === 100 ? 'text-teal-600' : 'text-blue-600')}>{e.pct}%</span>
                </div>
                <ProgressBar value={e.pct} color={e.hasOverdue ? 'bg-red-500' : e.pct === 100 ? 'bg-teal-400' : 'bg-blue-500'} />
                <div className="text-[9.5px] text-navy-300 mt-1">{e.done}/{e.total} training{e.hasOverdue ? ' · ⚠ overdue' : ''}</div>
              </div>
            ))}
            {empProgress.length === 0 && <div className="text-center text-navy-300 text-[11px] py-4">Belum ada data TNA</div>}
          </div>
        </div>

        <div className="col-span-2 space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowModal(true)} className="btn btn-teal btn-sm"><Plus size={12} /> Input TNA</button>
          </div>
          <div className="card overflow-x-auto">
            <table className="tbl" style={{ minWidth: 600 }}>
              <thead><tr><th>Karyawan</th><th>Training</th><th>Kategori</th><th>Metode</th><th>Target</th><th>Status</th><th>Skor</th><th>Aksi</th></tr></thead>
              <tbody>
                {tna.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div className="font-bold text-[12px]">{t.employee?.full_name?.split(' ').slice(0, 2).join(' ')}</div>
                      <div className="text-[10px] text-navy-300">{t.employee?.division}</div>
                    </td>
                    <td className="font-medium text-[11.5px]">{t.training_name}</td>
                    <td><Badge variant="gray">{t.training_category}</Badge></td>
                    <td className="text-[11px] text-navy-400">{t.training_method}</td>
                    <td className="text-[11px] text-navy-400">{fmtDate(t.target_date)}</td>
                    <td>
                      <select value={t.status} onChange={e => updateStatus(t.id, e.target.value)}
                        className={cn('badge border cursor-pointer outline-none bg-transparent text-[9.5px] font-bold appearance-none', `badge-${sc[t.status] ?? 'gray'}`)}>
                        {['Planned', 'In Progress', 'Done', 'Overdue', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className={cn('font-bold text-[12px]', t.score ? 'text-teal-600' : 'text-navy-300')}>{t.score ? `${t.score}/100` : '–'}</td>
                    <td><button onClick={() => delTNA(t.id)} className="text-red-400 hover:text-red-600 text-[11px] font-bold">Hapus</button></td>
                  </tr>
                ))}
                {tna.length === 0 && <EmptyState message="Belum ada data TNA" />}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <Modal title="Input TNA / Training" onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            <div><label className="form-label">Karyawan *</label>
              <select value={form.employee_id} onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))} className="form-input">
                <option value="">Pilih karyawan...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} — {e.division}</option>)}
              </select>
            </div>
            <div><label className="form-label">Nama training *</label><input value={form.training_name} onChange={e => setForm(p => ({ ...p, training_name: e.target.value }))} className="form-input" placeholder="e.g. Leadership Basics" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Kategori</label>
                <select value={form.training_category} onChange={e => setForm(p => ({ ...p, training_category: e.target.value }))} className="form-input">
                  {['Hard Skill', 'Soft Skill', 'Leadership', 'Technical', 'Compliance', 'Others'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="form-label">Metode</label>
                <select value={form.training_method} onChange={e => setForm(p => ({ ...p, training_method: e.target.value }))} className="form-input">
                  {['Online', 'Offline', 'Hybrid', 'Self-learning'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Target tanggal</label><input type="date" value={form.target_date} onChange={e => setForm(p => ({ ...p, target_date: e.target.value }))} className="form-input" /></div>
              <div><label className="form-label">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="form-input">
                  {['Planned', 'In Progress', 'Done', 'Overdue'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="btn btn-ghost">Batal</button>
              <button onClick={saveTNA} disabled={saving} className="btn btn-teal">{saving ? 'Menyimpan...' : 'Simpan TNA'}</button>
            </div>
          </div>
        </Modal>
      )}

      <div className="grid grid-cols-2 gap-3">
        <InsightCard title="Completion rate 61% — di bawah target 80%" text="Perlu akselerasi eksekusi training di Q2–Q3. Dewi Rahayu dan Anisa Fitriani perlu priority follow-up karena sudah overdue." />
        <InsightCard title="Avg hours/employee baru 6.9hr — target 12hr/tahun" text="Pertimbangkan format self-learning yang lebih fleksibel untuk meningkatkan jam training tanpa mengganggu produktivitas." color="bg-navy-600" titleColor="text-teal-200" />
      </div>
    </div>
  )
}
