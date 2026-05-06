'use client'
import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { KPICard, Badge, FunnelRow, InlineBar, InsightCard, EmptyState } from '@/components/ui'
import { fmtDate } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

export default function RecruitmentClient({ recruitment: init }: { recruitment: any[] }) {
  const [rec, setRec] = useState(init)
  const [search, setSearch] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ position: '', division: 'Creative', entity: 'SSR', hiring_source: 'Job Portal', quarter: 'Q2', year: 2026, status: 'Open', total_applicants: 0, screening_count: 0, interview_count: 0, offering_count: 0, target_date: '' })

  const open = rec.filter(r => ['Open', 'In Progress', 'Offering'].includes(r.status))
  const totApp = open.reduce((s, r) => s + r.total_applicants, 0)
  const totScr = open.reduce((s, r) => s + r.screening_count, 0)
  const totInt = open.reduce((s, r) => s + r.interview_count, 0)
  const totOff = open.reduce((s, r) => s + r.offering_count, 0)
  const filtered = rec.filter(r => (!search || r.position.toLowerCase().includes(search.toLowerCase())) && (!fStatus || r.status === fStatus))

  async function save() {
    if (!form.position) return
    setSaving(true)
    const res = await fetch('/api/recruitment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json()
    if (res.ok && data.data) { setRec(p => [data.data, ...p]); setShowModal(false) }
    setSaving(false)
  }

  async function del(id: string) {
    if (!confirm('Hapus posisi ini?')) return
    await fetch(`/api/recruitment?id=${id}`, { method: 'DELETE' })
    setRec(p => p.filter(r => r.id !== id))
  }

  const sc: Record<string, string> = { Open: 'blue', 'In Progress': 'amber', Offering: 'purple', Hired: 'teal', 'On Hold': 'gray', Cancelled: 'gray' }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-5 gap-3">
        <KPICard label="Open positions"   value={open.length}                          accent="bg-teal-400" />
        <KPICard label="Hired YTD"        value={rec.filter(r => r.status === 'Hired').length} change="+2 vs Q1" changeType="up" accent="bg-blue-400" />
        <KPICard label="Time to hire"     value="34 hr"  change="vs 38hr Q1" changeType="up"   accent="bg-amber-400" />
        <KPICard label="Time to fill"     value="52 hr"  change="di atas target" changeType="down" accent="bg-red-400" />
        <KPICard label="Total applicants" value={totApp}                               accent="bg-purple-400" />
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 card">
          <div className="card-head"><span className="card-title">Recruitment funnel — Q2 2026</span><Badge variant="blue">{totApp} kandidat</Badge></div>
          <div className="card-body">
            <FunnelRow label="Applicants" count={totApp} total={totApp} color="bg-navy-800" />
            <FunnelRow label="Screening"  count={totScr} total={totApp} color="bg-navy-600" />
            <FunnelRow label="Interview"  count={totInt} total={totApp} color="bg-teal-500" />
            <FunnelRow label="Offering"   count={totOff} total={totApp} color="bg-amber-500" />
            <FunnelRow label="Hired"      count={rec.filter(r => r.status === 'Hired').length} total={totApp} color="bg-teal-600" />
          </div>
        </div>
        <div className="col-span-2 card">
          <div className="card-head"><span className="card-title">Source of hire</span></div>
          <div className="card-body space-y-2">
            <InlineBar label="Job Portal" value="45%" pct={45} color="bg-navy-800" />
            <InlineBar label="Referral"   value="30%" pct={30} color="bg-teal-500" />
            <InlineBar label="LinkedIn"   value="25%" pct={25} color="bg-blue-500" />
          </div>
          <div className="px-5 pb-5">
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5">
              <div className="text-[11px] font-bold text-teal-800 mb-1">💡 Referral 2x lebih efektif</div>
              <div className="text-[10.5px] text-teal-700">Conversion rate referral 2x lebih tinggi dari job portal. Formalisasikan program referral.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <span className="card-title">Semua posisi</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-navy-50 border border-navy-100 rounded-lg px-2.5 py-1.5 w-40">
              <Search size={11} className="text-navy-300" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari posisi..." className="bg-transparent text-[11px] outline-none w-full" />
            </div>
            <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="form-input !w-auto py-1.5 text-[11px]">
              <option value="">Semua status</option>
              {['Open', 'In Progress', 'Offering', 'Hired', 'On Hold', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
            </select>
            <button onClick={() => setShowModal(true)} className="btn btn-teal btn-sm"><Plus size={12} /> Buka posisi</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl" style={{ minWidth: 800 }}>
            <thead><tr><th>Posisi</th><th>Divisi</th><th>Source</th><th>Applicants</th><th>Screening</th><th>Interview</th><th>Offering</th><th>Target</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td className="font-bold">{r.position}</td>
                  <td className="text-[11px] text-navy-600">{r.division}</td>
                  <td><Badge variant="gray">{r.hiring_source ?? '–'}</Badge></td>
                  <td className="font-bold text-teal-600">{r.total_applicants}</td>
                  <td>{r.screening_count}</td><td>{r.interview_count}</td><td>{r.offering_count}</td>
                  <td className="text-[11px] text-navy-400">{fmtDate(r.target_date)}</td>
                  <td><Badge variant={(sc[r.status] ?? 'gray') as any}>{r.status}</Badge></td>
                  <td><button onClick={() => del(r.id)} className="text-red-400 hover:text-red-600 text-[11px] font-bold">Hapus</button></td>
                </tr>
              ))}
              {filtered.length === 0 && <EmptyState />}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title="Buka posisi baru" onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            <div><label className="form-label">Nama posisi *</label><input value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} className="form-input" placeholder="e.g. Social Media Specialist" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Divisi</label>
                <select value={form.division} onChange={e => setForm(p => ({ ...p, division: e.target.value }))} className="form-input">
                  {['Creative', 'Marketing', 'Social Media', 'Human Capital', 'Finance', 'IT & Systems', 'Operations'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div><label className="form-label">Entitas</label>
                <select value={form.entity} onChange={e => setForm(p => ({ ...p, entity: e.target.value }))} className="form-input">
                  <option>SSR</option><option>Nyambee (PAT)</option><option>PAT-5758</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Source</label>
                <select value={form.hiring_source} onChange={e => setForm(p => ({ ...p, hiring_source: e.target.value }))} className="form-input">
                  {['Job Portal', 'LinkedIn', 'Referral', 'Internal', 'Headhunter'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="form-label">Target hire date</label><input type="date" value={form.target_date} onChange={e => setForm(p => ({ ...p, target_date: e.target.value }))} className="form-input" /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="btn btn-ghost">Batal</button>
              <button onClick={save} disabled={saving} className="btn btn-teal">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </Modal>
      )}

      <div className="grid grid-cols-2 gap-3">
        <InsightCard title="Bottleneck: Interview → Offering (33%)" text="Conversion dari interview ke offering sangat rendah. Kemungkinan salary ekspektasi tidak match. Rekomendasi: salary benchmarking dan fast-track approval." />
        <InsightCard title="Referral paling efektif" text="Conversion rate referral 2x lebih tinggi dari job portal. Formalisasikan program referral dengan insentif untuk karyawan yang merekomendasikan kandidat berhasil." color="bg-teal-700" titleColor="text-teal-200" />
      </div>
    </div>
  )
}
