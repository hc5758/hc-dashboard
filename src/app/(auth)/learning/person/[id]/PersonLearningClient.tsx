'use client'
import { useState } from 'react'
import { ArrowLeft, ExternalLink, Plus, Pencil, Trash2, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Badge, Avatar, ProgressBar, InsightCard, EmptyState } from '@/components/ui'
import { fmtDate, calcYoS, cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

const EMPTY = {
  training_name: '', training_category: 'Hard Skill', training_method: 'Online',
  quarter: 'Q2', year: 2026, target_date: '', status: 'Planned',
  vendor: '', duration_hours: 8, cost: 0, score: '', notes: '', file_link: '',
}

export default function PersonLearningClient({ employee, tna: initTna }: { employee: any; tna: any[] }) {
  const router = useRouter()
  const [tna, setTna] = useState(initTna)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)
  const fv = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }))

  const done = tna.filter(t => t.status === 'Done')
  const overdue = tna.filter(t => t.status === 'Overdue')
  const inProgress = tna.filter(t => t.status === 'In Progress')
  const totalHours = done.reduce((s, t) => s + (t.duration_hours ?? 0), 0)
  const avgScore = done.filter(t => t.score).length > 0
    ? Math.round(done.filter(t => t.score).reduce((s, t) => s + t.score, 0) / done.filter(t => t.score).length)
    : null

  const completionPct = tna.length > 0 ? Math.round(done.length / tna.length * 100) : 0

  function openAdd() { setForm({ ...EMPTY, year: new Date().getFullYear() }); setEditId(null); setShowModal(true) }
  function openEdit(t: any) {
    setForm({
      training_name: t.training_name, training_category: t.training_category || 'Hard Skill',
      training_method: t.training_method || 'Online', quarter: t.quarter || 'Q2',
      year: t.year || 2026, target_date: t.target_date || '', status: t.status,
      vendor: t.vendor || '', duration_hours: t.duration_hours || 8, cost: t.cost || 0,
      score: t.score || '', notes: t.notes || '', file_link: t.notes?.startsWith('http') ? t.notes : '',
    })
    setEditId(t.id); setShowModal(true)
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/tna?id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    setTna(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }

  async function save() {
    if (!form.training_name) { alert('Nama training wajib diisi'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        employee_id: employee.id,
        score: form.score ? parseInt(form.score) : null,
        cost: parseInt(form.cost) || 0,
        // store file_link in notes if starts with http
        notes: form.file_link ? form.file_link : form.notes,
      }
      if (editId) {
        const res = await fetch('/api/tna', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editId, ...payload }) })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setTna(prev => prev.map(t => t.id === editId ? data.data : t))
      } else {
        const res = await fetch('/api/tna', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setTna(prev => [data.data, ...prev])
      }
      setShowModal(false)
    } catch (err: any) { alert('Error: ' + err.message) }
    setSaving(false)
  }

  async function del(id: string) {
    if (!confirm('Hapus training ini?')) return
    await fetch(`/api/tna?id=${id}`, { method: 'DELETE' })
    setTna(prev => prev.filter(t => t.id !== id))
  }

  const STATUS_COLOR: Record<string, string> = { Done: 'teal', 'In Progress': 'blue', Planned: 'gray', Overdue: 'red', Cancelled: 'gray' }

  return (
    <div className="space-y-5">
      <button onClick={() => router.push('/learning')}
        className="flex items-center gap-2 text-[12.5px] text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft size={15} /> Kembali ke Learning & Dev
      </button>

      {/* Employee header */}
      <div className="card p-5 flex items-center gap-5">
        <Avatar name={employee.full_name} size="lg" />
        <div className="flex-1">
          <div className="text-[16px] font-semibold text-slate-800">{employee.full_name}</div>
          <div className="text-[12.5px] text-slate-500 mt-0.5">{employee.position} · {employee.division}</div>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="navy">{employee.entity}</Badge>
            <Badge variant={employee.employment_type === 'PKWTT' ? 'teal' : 'blue'}>{employee.employment_type}</Badge>
            <span className="text-[11.5px] text-slate-400">Bergabung {fmtDate(employee.join_date)} · {calcYoS(employee.join_date)}</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className={`text-2xl font-bold ${completionPct >= 80 ? 'text-teal-600' : completionPct >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{completionPct}%</div>
            <div className="text-[10.5px] text-slate-400 mt-0.5">Completion</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{tna.length}</div>
            <div className="text-[10.5px] text-slate-400 mt-0.5">Total training</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{totalHours}</div>
            <div className="text-[10.5px] text-slate-400 mt-0.5">Jam training</div>
          </div>
          <div>
            <div className={`text-2xl font-bold ${avgScore ? (avgScore >= 80 ? 'text-teal-600' : 'text-amber-500') : 'text-slate-300'}`}>
              {avgScore ?? '–'}
            </div>
            <div className="text-[10.5px] text-slate-400 mt-0.5">Avg score</div>
          </div>
        </div>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Selesai', count: done.length, color: 'bg-teal-50 text-teal-600', border: 'border-teal-200' },
          { label: 'In Progress', count: inProgress.length, color: 'bg-blue-50 text-blue-600', border: 'border-blue-200' },
          { label: 'Planned', count: tna.filter(t => t.status === 'Planned').length, color: 'bg-slate-50 text-slate-500', border: 'border-slate-200' },
          { label: 'Overdue', count: overdue.length, color: 'bg-red-50 text-red-600', border: 'border-red-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 flex items-center gap-3 ${s.border} bg-white`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-[12.5px] font-semibold text-slate-700">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Training list */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">Daftar training {employee.full_name.split(' ')[0]}</span>
          <button onClick={openAdd} className="btn btn-teal btn-sm"><Plus size={12} /> Tambah training</button>
        </div>

        {tna.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-slate-400">Belum ada data training untuk karyawan ini</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {tna.map(t => {
              const hasFile = t.notes && t.notes.startsWith('http')
              return (
                <div key={t.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  {/* Status indicator */}
                  <div className={cn('w-2 h-2 rounded-full mt-2 flex-shrink-0',
                    t.status === 'Done' ? 'bg-teal-500' : t.status === 'In Progress' ? 'bg-blue-500' : t.status === 'Overdue' ? 'bg-red-500' : 'bg-slate-300'
                  )} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[13px] font-semibold text-slate-800">{t.training_name}</span>
                      <Badge variant={(STATUS_COLOR[t.status] ?? 'gray') as any}>{t.status}</Badge>
                      {t.training_category && <Badge variant="gray">{t.training_category}</Badge>}
                      {t.training_method && <Badge variant="navy">{t.training_method}</Badge>}
                    </div>
                    <div className="flex items-center gap-4 text-[11.5px] text-slate-400 flex-wrap">
                      {t.vendor && <span>📦 {t.vendor}</span>}
                      {t.target_date && <span>🗓 Target: {fmtDate(t.target_date)}</span>}
                      {t.actual_date && <span>✅ Selesai: {fmtDate(t.actual_date)}</span>}
                      {t.duration_hours && <span>⏱ {t.duration_hours} jam</span>}
                      {t.score && <span className="font-semibold text-teal-600">🏆 Score: {t.score}/100</span>}
                    </div>
                    {/* Progress bar for in-progress */}
                    {t.status === 'In Progress' && (
                      <div className="mt-2 max-w-xs">
                        <ProgressBar value={50} color="bg-blue-400" />
                        <div className="text-[10.5px] text-slate-400 mt-0.5">Sedang berjalan</div>
                      </div>
                    )}
                  </div>

                  {/* File link */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasFile && (
                      <a href={t.notes} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 transition-colors">
                        <FileText size={12} /> Buka file
                      </a>
                    )}
                    {/* Status dropdown */}
                    <select value={t.status} onChange={e => updateStatus(t.id, e.target.value)}
                      className="text-[10.5px] font-semibold bg-transparent outline-none cursor-pointer border border-slate-200 rounded-lg px-2 py-1 text-slate-600 hover:border-teal-400">
                      {['Planned', 'In Progress', 'Done', 'Overdue', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
                    </select>
                    <button onClick={() => openEdit(t)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => del(t.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-500 text-slate-400">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal title={editId ? 'Edit training' : 'Tambah training baru'} onClose={() => setShowModal(false)} size="lg">
          <div className="space-y-3">
            <div>
              <label className="form-label">Nama training *</label>
              <input value={form.training_name} onChange={e => fv('training_name', e.target.value)} className="form-input" placeholder="e.g. Leadership Basics" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Kategori</label>
                <select value={form.training_category} onChange={e => fv('training_category', e.target.value)} className="form-input">
                  {['Hard Skill', 'Soft Skill', 'Leadership', 'Technical', 'Compliance', 'Others'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="form-label">Metode</label>
                <select value={form.training_method} onChange={e => fv('training_method', e.target.value)} className="form-input">
                  {['Online', 'Offline', 'Hybrid', 'Self-learning'].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Vendor / Provider</label>
                <input value={form.vendor} onChange={e => fv('vendor', e.target.value)} className="form-input" placeholder="e.g. Prasetiya Mulya, Coursera" />
              </div>
              <div><label className="form-label">Durasi (jam)</label>
                <input type="number" value={form.duration_hours} onChange={e => fv('duration_hours', parseInt(e.target.value) || 0)} className="form-input" min={0} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Target tanggal</label>
                <input type="date" value={form.target_date} onChange={e => fv('target_date', e.target.value)} className="form-input" />
              </div>
              <div><label className="form-label">Status</label>
                <select value={form.status} onChange={e => fv('status', e.target.value)} className="form-input">
                  {['Planned', 'In Progress', 'Done', 'Overdue', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Score (jika sudah selesai)</label>
                <input type="number" value={form.score} onChange={e => fv('score', e.target.value)} className="form-input" placeholder="0-100" min={0} max={100} />
              </div>
              <div><label className="form-label">Biaya (Rp)</label>
                <input type="number" value={form.cost} onChange={e => fv('cost', e.target.value)} className="form-input" min={0} />
              </div>
            </div>
            <div>
              <label className="form-label">Link file / materi (Google Drive, Notion, dll)</label>
              <input value={form.file_link} onChange={e => fv('file_link', e.target.value)} className="form-input" placeholder="https://drive.google.com/..." />
            </div>
            <div>
              <label className="form-label">Catatan</label>
              <textarea value={form.notes} onChange={e => fv('notes', e.target.value)} className="form-input h-14 resize-none" placeholder="Catatan tambahan..." />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="btn btn-ghost">Batal</button>
              <button onClick={save} disabled={saving} className="btn btn-teal">{saving ? 'Menyimpan...' : editId ? 'Update' : 'Simpan'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
