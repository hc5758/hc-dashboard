'use client'
import { useState } from 'react'
import { ArrowLeft, ExternalLink, Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Badge, Avatar, ProgressBar, InsightCard, EmptyState } from '@/components/ui'
import { fmtDate, calcYoS, cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

// Dummy score map — in production fetch from a scores table
const SCORE_MAP: Record<string, number> = {
  'Budi Santoso': 91, 'Nita Rahma': 88, 'Lita Anggraini': 85,
  'Hendra Wijaya': 62, 'Putri Handayani': 71, 'Andi Kurniawan': 79,
  'Anisa Fitriani': 93, 'Dewi Rahayu': 87, 'Ahmad Rifai': 90,
  'Maya Putri': 88, 'Rizky Pratama': 82, 'Fajar Rahman': 75,
}

const EMPTY_MEMBER_FORM = {
  employee_id: '', csat_link: '', kpi_link: '',
  csat_score: '', kpi_score: '', notes: '',
}

export default function TeamDetailClient({ division, employees, pip, tna }: {
  division: string; employees: any[]; pip: any[]; tna: any[]
}) {
  const router = useRouter()
  const [memberLinks, setMemberLinks] = useState<Record<string, { csat_link: string; kpi_link: string; csat_score: string; kpi_score: string; notes: string }>>({})
  const [showModal, setShowModal] = useState(false)
  const [editEmpId, setEditEmpId] = useState<string | null>(null)
  const [form, setForm] = useState<any>(EMPTY_MEMBER_FORM)
  const [expanded, setExpanded] = useState<string | null>(null)
  const fv = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }))

  const teamPip = pip.filter(p => employees.some(e => e.id === p.employee_id))
  const teamTna = tna.filter(t => employees.some(e => e.id === t.employee_id))

  const scores = employees.map(e => ({
    ...e,
    score: SCORE_MAP[e.full_name] ?? Math.floor(70 + Math.random() * 25),
    pip: teamPip.filter(p => p.employee_id === e.id),
    links: memberLinks[e.id] ?? { csat_link: '', kpi_link: '', csat_score: '', kpi_score: '', notes: '' },
  }))

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((s, e) => s + e.score, 0) / scores.length) : 0

  function openEdit(emp: any) {
    setEditEmpId(emp.id)
    setForm({
      employee_id: emp.id,
      ...memberLinks[emp.id] ?? EMPTY_MEMBER_FORM,
    })
    setShowModal(true)
  }

  function saveLinks() {
    if (!editEmpId) return
    setMemberLinks(prev => ({
      ...prev,
      [editEmpId]: {
        csat_link: form.csat_link,
        kpi_link: form.kpi_link,
        csat_score: form.csat_score,
        kpi_score: form.kpi_score,
        notes: form.notes,
      },
    }))
    setShowModal(false)
  }

  return (
    <div className="space-y-5">
      {/* Back */}
      <button onClick={() => router.push('/performance')}
        className="flex items-center gap-2 text-[12.5px] text-slate-500 hover:text-slate-800 transition-colors">
        <ArrowLeft size={15} /> Kembali ke Performance
      </button>

      {/* Header stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-lg">{employees.length}</div>
          <div><div className="text-[11px] text-slate-400 font-medium">Total anggota</div><div className="text-[13px] font-semibold text-slate-800">{division}</div></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg',
            avgScore >= 85 ? 'bg-teal-50 text-teal-600' : avgScore >= 70 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600')}>
            {avgScore}
          </div>
          <div><div className="text-[11px] text-slate-400 font-medium">Avg score tim</div><div className="text-[13px] font-semibold text-slate-800">dari 100</div></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 font-bold text-lg">{teamPip.filter(p => p.status === 'Active').length}</div>
          <div><div className="text-[11px] text-slate-400 font-medium">PIP/SP aktif</div><div className="text-[13px] font-semibold text-slate-800">dalam tim</div></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-lg">
            {teamTna.filter(t => t.status === 'Done').length}
          </div>
          <div><div className="text-[11px] text-slate-400 font-medium">Training selesai</div><div className="text-[13px] font-semibold text-slate-800">YTD 2026</div></div>
        </div>
      </div>

      {/* Team table */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">Anggota tim — {division}</span>
          <Badge variant="gray">{employees.length} orang</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Posisi</th>
                <th>Masa kerja</th>
                <th className="text-center">Performance Score</th>
                <th className="text-center">Form CSAT</th>
                <th className="text-center">Form KPI</th>
                <th>PIC Input</th>
                <th>Status</th>
                <th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {scores.map(emp => (
                <>
                  <tr key={emp.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={emp.full_name} size="sm" />
                        <div>
                          <div className="font-semibold text-[12.5px]">{emp.full_name}</div>
                          <div className="text-[10.5px] text-slate-400">{emp.employee_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-[12px] text-slate-500">{emp.position}</td>
                    <td className="text-[12px] text-slate-500">{calcYoS(emp.join_date)}</td>
                    <td>
                      <div className="flex flex-col items-center gap-1">
                        <div className={cn('text-[14px] font-bold',
                          emp.score >= 85 ? 'text-teal-600' : emp.score >= 70 ? 'text-amber-600' : 'text-red-600')}>
                          {emp.score}/100
                        </div>
                        <div className="w-20">
                          <ProgressBar value={emp.score}
                            color={emp.score >= 85 ? 'bg-teal-500' : emp.score >= 70 ? 'bg-amber-500' : 'bg-red-500'} />
                        </div>
                      </div>
                    </td>

                    {/* CSAT Link */}
                    <td className="text-center">
                      {emp.links.csat_link ? (
                        <div className="flex flex-col items-center gap-1">
                          <a href={emp.links.csat_link} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            <ExternalLink size={10} /> Buka Sheet
                          </a>
                          {emp.links.csat_score && <div className="text-[10px] text-slate-400">{emp.links.csat_score}</div>}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-300">Belum diisi</span>
                      )}
                    </td>

                    {/* KPI Link */}
                    <td className="text-center">
                      {emp.links.kpi_link ? (
                        <div className="flex flex-col items-center gap-1">
                          <a href={emp.links.kpi_link} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-teal-600 hover:text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                            <ExternalLink size={10} /> Buka Sheet
                          </a>
                          {emp.links.kpi_score && <div className="text-[10px] text-slate-400">{emp.links.kpi_score}</div>}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-300">Belum diisi</span>
                      )}
                    </td>

                    <td className="text-[12px] text-slate-500">{emp.links.notes || '–'}</td>
                    <td>
                      {emp.pip.length > 0
                        ? <Badge variant="red">PIP/SP Aktif</Badge>
                        : <Badge variant="teal">Normal</Badge>}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setExpanded(expanded === emp.id ? null : emp.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-teal-50 hover:text-teal-600 text-slate-400 transition-colors">
                          {expanded === emp.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                        <button onClick={() => openEdit(emp)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400 transition-colors">
                          <Pencil size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded row — training detail */}
                  {expanded === emp.id && (
                    <tr key={emp.id + '_detail'}>
                      <td colSpan={9} className="bg-slate-50 px-5 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-[11px] font-semibold text-slate-600 mb-2">Training yang sedang / sudah dijalani</div>
                            {teamTna.filter(t => t.employee_id === emp.id).length === 0
                              ? <div className="text-[11px] text-slate-400">Belum ada data training</div>
                              : teamTna.filter(t => t.employee_id === emp.id).map(t => (
                                <div key={t.id} className="flex items-center gap-3 mb-2">
                                  <Badge variant={t.status === 'Done' ? 'teal' : t.status === 'Overdue' ? 'red' : 'blue'}>{t.status}</Badge>
                                  <span className="text-[12px] text-slate-700 font-medium">{t.training_name}</span>
                                  <span className="text-[11px] text-slate-400">{t.training_category}</span>
                                  {t.score && <span className="text-[11px] font-semibold text-teal-600">{t.score}/100</span>}
                                </div>
                              ))
                            }
                          </div>
                          {emp.pip.length > 0 && (
                            <div>
                              <div className="text-[11px] font-semibold text-slate-600 mb-2">PIP / SP aktif</div>
                              {emp.pip.map((p: any) => (
                                <div key={p.id} className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="red">{p.type}</Badge>
                                    <span className="text-[11px] text-slate-500">{fmtDate(p.issue_date)} – {fmtDate(p.end_date)}</span>
                                  </div>
                                  <div className="text-[11.5px] text-slate-700">{p.reason}</div>
                                  {p.improvement_plan && <div className="text-[11px] text-slate-500 mt-1">📋 {p.improvement_plan}</div>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {employees.length === 0 && <EmptyState message="Tidak ada anggota tim" />}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal input links */}
      {showModal && (
        <Modal title="Input CSAT & KPI Link" onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-lg p-3 text-[12px] text-slate-500">
              Paste URL Google Sheet CSAT dan KPI untuk karyawan ini. Link akan langsung bisa diklik dari tabel.
            </div>
            <div>
              <label className="form-label">Link Form CSAT (Google Sheet)</label>
              <input value={form.csat_link} onChange={e => fv('csat_link', e.target.value)}
                className="form-input" placeholder="https://docs.google.com/spreadsheets/..." />
            </div>
            <div>
              <label className="form-label">Skor CSAT (opsional)</label>
              <input value={form.csat_score} onChange={e => fv('csat_score', e.target.value)}
                className="form-input" placeholder="e.g. 4.2/5 atau 84%" />
            </div>
            <div>
              <label className="form-label">Link Form KPI Team (Google Sheet)</label>
              <input value={form.kpi_link} onChange={e => fv('kpi_link', e.target.value)}
                className="form-input" placeholder="https://docs.google.com/spreadsheets/..." />
            </div>
            <div>
              <label className="form-label">Skor KPI (opsional)</label>
              <input value={form.kpi_score} onChange={e => fv('kpi_score', e.target.value)}
                className="form-input" placeholder="e.g. 91.3/100 atau Completed" />
            </div>
            <div>
              <label className="form-label">PIC Input</label>
              <input value={form.notes} onChange={e => fv('notes', e.target.value)}
                className="form-input" placeholder="Nama PIC yang input data" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="btn btn-ghost">Batal</button>
              <button onClick={saveLinks} className="btn btn-teal">Simpan</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
