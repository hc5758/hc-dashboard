'use client'
import { useState, useMemo } from 'react'
import { Plus, ChevronLeft, ChevronRight, Bell, Trash2, Pencil } from 'lucide-react'
import { KPICard, Badge, EmptyState } from '@/components/ui'
import { fmtDate, cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const DAYS   = ['Sen','Sel','Rab','Kam','Jum','Sab','Min']

const LEAVE_COLORS: Record<string, string> = {
  Tahunan:       'bg-teal-500',
  Sakit:         'bg-blue-500',
  Penting:       'bg-amber-500',
  Melahirkan:    'bg-purple-500',
  'Cuti Bersama':'bg-[#1a2d5a]',
  Unpaid:        'bg-gray-400',
}
const LEAVE_BADGE: Record<string, string> = {
  Tahunan: 'teal', Sakit: 'blue', Penting: 'amber',
  Melahirkan: 'purple', 'Cuti Bersama': 'navy', Unpaid: 'gray',
}

const EMPTY_FORM = {
  employee_id: '', leave_type: 'Tahunan',
  start_date: '', end_date: '', total_days: 1, status: 'Approved', notes: '',
}

export default function CutiClient({ leave: init, employees }: { leave: any[]; employees: any[] }) {
  const today = new Date()
  const [leave, setLeave]   = useState(init)
  const [calY, setCalY]     = useState(today.getFullYear())
  const [calM, setCalM]     = useState(today.getMonth())
  const [selected, setSelected] = useState<string | null>(null) // 'YYYY-MM-DD'
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm]     = useState<any>(EMPTY_FORM)
  const f = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }))

  // Auto-calculate total_days when dates change
  function onDateChange(field: 'start_date' | 'end_date', val: string) {
    const next = { ...form, [field]: val }
    if (next.start_date && next.end_date) {
      const diff = Math.max(1, Math.round((new Date(next.end_date).getTime() - new Date(next.start_date).getTime()) / 86400000) + 1)
      next.total_days = diff
    }
    setForm(next)
  }

  // ── REMINDERS: cuti yang akan datang dalam 7 hari ──
  const upcoming = useMemo(() => {
    const now = new Date(); now.setHours(0,0,0,0)
    const in7 = new Date(now.getTime() + 7 * 86400000)
    return leave.filter(l => {
      const s = new Date(l.start_date); s.setHours(0,0,0,0)
      return s >= now && s <= in7 && l.status === 'Approved'
    }).sort((a,b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
  }, [leave])

  // ── CUTI BULAN INI (untuk kalender) ──
  const leaveThisMonth = useMemo(() => {
    return leave.filter(l => {
      const s = new Date(l.start_date), e = new Date(l.end_date)
      const mStart = new Date(calY, calM, 1)
      const mEnd   = new Date(calY, calM + 1, 0)
      return s <= mEnd && e >= mStart && l.status === 'Approved'
    })
  }, [leave, calY, calM])

  // ── MAP: date → list of leave ──
  const dayMap = useMemo(() => {
    const map: Record<string, any[]> = {}
    leaveThisMonth.forEach(l => {
      const s = new Date(l.start_date), e = new Date(l.end_date)
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10)
        if (!map[key]) map[key] = []
        map[key].push(l)
      }
    })
    return map
  }, [leaveThisMonth])

  // ── SELECTED DAY LEAVE ──
  const selectedLeave = selected ? (dayMap[selected] ?? []) : []

  // ── CALENDAR BUILD ──
  const firstDay = new Date(calY, calM, 1).getDay()
  const offset   = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(calY, calM + 1, 0).getDate()
  const todayStr = today.toISOString().slice(0, 10)

  function prevMonth() { if (calM === 0) { setCalM(11); setCalY(y => y-1) } else setCalM(m => m-1); setSelected(null) }
  function nextMonth() { if (calM === 11) { setCalM(0);  setCalY(y => y+1) } else setCalM(m => m+1); setSelected(null) }

  // ── STATS ──
  const thisMonthLeave = leave.filter(l => {
    const s = new Date(l.start_date)
    return s.getMonth() === today.getMonth() && s.getFullYear() === today.getFullYear() && l.status === 'Approved'
  })
  const onLeaveToday = leave.filter(l => {
    const s = new Date(l.start_date), e = new Date(l.end_date)
    const t = new Date(); t.setHours(0,0,0,0)
    return s <= t && e >= t && l.status === 'Approved'
  })

  // ── CRUD ──
  function openAdd(dateStr?: string) {
    setForm({ ...EMPTY_FORM, start_date: dateStr ?? '', end_date: dateStr ?? '' })
    setEditId(null)
    setShowModal(true)
  }

  function openEdit(l: any) {
    setForm({
      employee_id: l.employee_id,
      leave_type: l.leave_type,
      start_date: l.start_date,
      end_date: l.end_date,
      total_days: l.total_days,
      status: l.status,
      notes: l.notes ?? '',
    })
    setEditId(l.id)
    setShowModal(true)
  }

  async function saveLeave() {
    if (!form.employee_id || !form.start_date || !form.end_date) {
      alert('Karyawan, tanggal mulai, dan tanggal selesai wajib diisi.')
      return
    }
    setSaving(true)
    try {
      if (editId) {
        const res = await fetch('/api/leave', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...form }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        const emp = employees.find(e => e.id === form.employee_id)
        setLeave(prev => prev.map(l => l.id === editId ? { ...data.data, employee: emp } : l))
      } else {
        const res = await fetch('/api/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        const emp = employees.find(e => e.id === form.employee_id)
        setLeave(prev => [{ ...data.data, employee: emp }, ...prev])
      }
      setShowModal(false)
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
    setSaving(false)
  }

  async function deleteLeave(id: string) {
    if (!confirm('Hapus data cuti ini?')) return
    const res = await fetch(`/api/leave?id=${id}`, { method: 'DELETE' })
    if (res.ok) setLeave(prev => prev.filter(l => l.id !== id))
  }

  return (
    <div className="space-y-4">

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KPICard label="Cuti hari ini"      value={onLeaveToday.length}    accent="bg-red-400"    change={onLeaveToday.length > 0 ? 'sedang cuti' : 'tidak ada'} changeType={onLeaveToday.length > 0 ? 'down' : 'flat'} />
        <KPICard label="Cuti bulan ini"     value={thisMonthLeave.length}  accent="bg-teal-400"   change={MONTHS[today.getMonth()]} changeType="flat" />
        <KPICard label="Reminder <7 hari"   value={upcoming.length}        accent="bg-amber-400"  change={upcoming.length > 0 ? 'akan cuti' : 'aman'} changeType={upcoming.length > 0 ? 'down' : 'flat'} />
        <KPICard label="Total records"      value={leave.filter(l => l.status === 'Approved').length} accent="bg-blue-400" change="YTD 2026" changeType="flat" />
      </div>

      {/* Reminder strip */}
      {upcoming.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={15} className="text-amber-600" />
            <span className="text-[12px] font-bold text-amber-800">Reminder — {upcoming.length} karyawan akan cuti dalam 7 hari ke depan</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {upcoming.map(l => (
              <div key={l.id} className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-1.5">
                <div className={cn('w-2 h-2 rounded-full', LEAVE_COLORS[l.leave_type] ?? 'bg-gray-400')} />
                <span className="text-[11px] font-bold text-slate-800">{l.employee?.full_name}</span>
                <span className="text-[10px] text-slate-400">{fmtDate(l.start_date)}{l.start_date !== l.end_date ? ` – ${fmtDate(l.end_date)}` : ''}</span>
                <Badge variant={(LEAVE_BADGE[l.leave_type] ?? 'gray') as any}>{l.leave_type}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAIN: Calendar + Detail */}
      <div className="grid grid-cols-3 gap-4">

        {/* Calendar */}
        <div className="col-span-2 card">
          <div className="card-head">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-100 hover:bg-slate-50 text-slate-400 transition-colors">
                <ChevronLeft size={14} />
              </button>
              <span className="card-title">{MONTHS[calM]} {calY}</span>
              <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-100 hover:bg-slate-50 text-slate-400 transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
            <button onClick={() => openAdd()} className="btn btn-teal btn-sm">
              <Plus size={12} /> Tambah cuti
            </button>
          </div>

          <div className="p-4">
            {/* Day labels */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-slate-300 py-1">{d}</div>
              ))}
            </div>

            {/* Cells */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day  = i + 1
                const dateStr = `${calY}-${String(calM+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                const isToday = dateStr === todayStr
                const isSel   = dateStr === selected
                const dayLeave = dayMap[dateStr] ?? []
                const hasLeave = dayLeave.length > 0

                return (
                  <div
                    key={day}
                    onClick={() => setSelected(isSel ? null : dateStr)}
                    className={cn(
                      'rounded-xl p-1.5 cursor-pointer transition-all min-h-[52px] flex flex-col',
                      isToday ? 'bg-[#0f1e3d] text-white' : isSel ? 'bg-teal-50 border-2 border-teal-400' : hasLeave ? 'bg-slate-50 hover:bg-slate-100' : 'hover:bg-slate-50',
                    )}
                  >
                    <div className={cn('text-[12px] font-bold w-6 h-6 flex items-center justify-center rounded-full mb-0.5',
                      isToday ? 'bg-white text-slate-800' : 'text-slate-800'
                    )}>{day}</div>
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      {dayLeave.slice(0, 2).map((l, idx) => (
                        <div key={idx} className={cn('text-[8.5px] font-bold text-white rounded px-1 truncate', LEAVE_COLORS[l.leave_type] ?? 'bg-gray-400')}>
                          {l.employee?.full_name?.split(' ')[0]}
                        </div>
                      ))}
                      {dayLeave.length > 2 && (
                        <div className="text-[8px] text-slate-400 font-bold">+{dayLeave.length - 2} lagi</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-slate-50">
              {Object.entries(LEAVE_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <div className={cn('w-2.5 h-2.5 rounded-sm', color)} />
                  <span className="text-[10px] text-slate-400">{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel: selected day or upcoming */}
        <div className="flex flex-col gap-4">
          {selected ? (
            <div className="card flex-1">
              <div className="card-head">
                <span className="card-title">
                  {new Date(selected + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
                <button onClick={() => openAdd(selected)} className="btn btn-teal btn-sm">
                  <Plus size={11} />
                </button>
              </div>
              {selectedLeave.length === 0 ? (
                <div className="p-5 text-center text-[11px] text-slate-300">Tidak ada cuti di tanggal ini</div>
              ) : (
                <div>
                  {selectedLeave.map(l => (
                    <div key={l.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0">
                      <div className={cn('w-2 h-10 rounded-full flex-shrink-0', LEAVE_COLORS[l.leave_type] ?? 'bg-gray-400')} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[12px] text-slate-800">{l.employee?.full_name}</div>
                        <div className="text-[10px] text-slate-400">{l.employee?.division}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={(LEAVE_BADGE[l.leave_type] ?? 'gray') as any}>{l.leave_type}</Badge>
                          <span className="text-[10px] text-slate-400">{l.total_days} hari</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(l)} className="w-6 h-6 flex items-center justify-center rounded bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400">
                          <Pencil size={11} />
                        </button>
                        <button onClick={() => deleteLeave(l.id)} className="w-6 h-6 flex items-center justify-center rounded bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-400">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card flex-1">
              <div className="card-head"><span className="card-title">Cuti bulan {MONTHS[calM]}</span><Badge variant="teal">{leaveThisMonth.length}</Badge></div>
              {leaveThisMonth.length === 0 ? (
                <div className="p-5 text-center text-[11px] text-slate-300">Tidak ada cuti bulan ini</div>
              ) : (
                <div className="overflow-y-auto" style={{ maxHeight: 380 }}>
                  {leaveThisMonth.sort((a,b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).map(l => (
                    <div key={l.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 last:border-0">
                      <div className={cn('w-1.5 h-8 rounded-full flex-shrink-0', LEAVE_COLORS[l.leave_type] ?? 'bg-gray-400')} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[11.5px] truncate">{l.employee?.full_name}</div>
                        <div className="text-[9.5px] text-slate-400">{fmtDate(l.start_date)} – {fmtDate(l.end_date)}</div>
                      </div>
                      <Badge variant={(LEAVE_BADGE[l.leave_type] ?? 'gray') as any}>{l.leave_type}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Rekap type */}
          <div className="card">
            <div className="card-head"><span className="card-title">Rekap tipe cuti</span></div>
            <div className="card-body space-y-2">
              {Object.entries(
                leave.filter(l => l.status === 'Approved').reduce((acc: any, l) => {
                  acc[l.leave_type] = (acc[l.leave_type] || 0) + l.total_days; return acc
                }, {})
              ).sort((a:any,b:any) => b[1]-a[1]).map(([type, days]) => (
                <div key={type} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', LEAVE_COLORS[type] ?? 'bg-gray-400')} />
                    <span className="text-[11px] text-slate-600">{type}</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-800">{days as number} hr</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabel semua cuti */}
      <div className="card overflow-x-auto">
        <div className="card-head">
          <span className="card-title">Semua data cuti</span>
          <button onClick={() => openAdd()} className="btn btn-teal btn-sm"><Plus size={12} /> Tambah</button>
        </div>
        <table className="tbl">
          <thead><tr><th>Karyawan</th><th>Divisi</th><th>Tipe</th><th>Mulai</th><th>Selesai</th><th>Total hari</th><th>Status</th><th className="text-center">Aksi</th></tr></thead>
          <tbody>
            {leave.length === 0 ? <EmptyState message="Belum ada data cuti" /> : leave.map(l => (
              <tr key={l.id}>
                <td className="font-bold">{l.employee?.full_name}</td>
                <td className="text-[11px] text-slate-400">{l.employee?.division}</td>
                <td><Badge variant={(LEAVE_BADGE[l.leave_type] ?? 'gray') as any}>{l.leave_type}</Badge></td>
                <td className="text-[11px] text-slate-400">{fmtDate(l.start_date)}</td>
                <td className="text-[11px] text-slate-400">{fmtDate(l.end_date)}</td>
                <td className="font-bold">{l.total_days} hari</td>
                <td><Badge variant={l.status === 'Approved' ? 'teal' : l.status === 'Rejected' ? 'red' : 'amber'}>{l.status}</Badge></td>
                <td>
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(l)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => deleteLeave(l.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-400">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal title={editId ? 'Edit data cuti' : 'Tambah cuti karyawan'} onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            <div>
              <label className="form-label">Karyawan *</label>
              <select value={form.employee_id} onChange={e => f('employee_id', e.target.value)} className="form-input">
                <option value="">Pilih karyawan...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} — {e.division}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Tipe cuti</label>
              <select value={form.leave_type} onChange={e => f('leave_type', e.target.value)} className="form-input">
                {['Tahunan','Sakit','Penting','Melahirkan','Cuti Bersama','Unpaid'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Tanggal mulai *</label>
                <input type="date" value={form.start_date} onChange={e => onDateChange('start_date', e.target.value)} className="form-input" />
              </div>
              <div>
                <label className="form-label">Tanggal selesai *</label>
                <input type="date" value={form.end_date} onChange={e => onDateChange('end_date', e.target.value)} className="form-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Total hari</label>
                <input type="number" value={form.total_days} onChange={e => f('total_days', parseInt(e.target.value))} className="form-input" min={1} />
              </div>
              <div>
                <label className="form-label">Status</label>
                <select value={form.status} onChange={e => f('status', e.target.value)} className="form-input">
                  <option>Approved</option><option>Pending</option><option>Rejected</option>
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">Catatan</label>
              <input value={form.notes} onChange={e => f('notes', e.target.value)} className="form-input" placeholder="Opsional..." />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="btn btn-ghost">Batal</button>
              <button onClick={saveLeave} disabled={saving} className="btn btn-teal">
                {saving ? 'Menyimpan...' : editId ? 'Update cuti' : 'Simpan cuti'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
