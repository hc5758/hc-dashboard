'use client'
import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { KPICard, Badge, FunnelRow, InlineBar, InsightCard, EmptyState } from '@/components/ui'
import { fmtDate, cn } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

interface Props { recruitment: any[] }

export default function RecruitmentClient({ recruitment: init }: Props) {
  const [rec, setRec] = useState(init)
  const [search, setSearch] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    position: '', division: 'Creative', entity: 'SSR',
    hiring_source: 'Job Portal', quarter: 'Q2', year: 2026,
    status: 'Open', total_applicants: 0, screening_count: 0,
    interview_count: 0, offering_count: 0, target_date: '',
  })
  const [saving, setSaving] = useState(false)

  const open = rec.filter(r => ['Open','In Progress','Offering'].includes(r.status))
  const totalApplicants = open.reduce((s, r) => s + r.total_applicants, 0)
  const totalScreening  = open.reduce((s, r) => s + r.screening_count, 0)
  const totalInterview  = open.reduce((s, r) => s + r.interview_count, 0)
  const totalOffering   = open.reduce((s, r) => s + r.offering_count, 0)

  const filtered = rec.filter(r =>
    (!search || r.position.toLowerCase().includes(search.toLowerCase()) || r.division.toLowerCase().includes(search.toLowerCase())) &&
    (!fStatus || r.status === fStatus)
  )

  async function savePosition() {
    if (!form.position) return
    setSaving(true)
    const res = await fetch('/api/recruitment', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok && data.data) {
      setRec(prev => [data.data, ...prev])
      setShowModal(false)
    }
    setSaving(false)
  }

  async function deleteRec(id: string) {
    if (!confirm('Hapus posisi ini?')) return
    await fetch(`/api/recruitment?id=${id}`, { method: 'DELETE' })
    setRec(prev => prev.filter(r => r.id !== id))
  }

  const statusColors: Record<string, string> = {
    'Open': 'blue', 'In Progress': 'amber', 'Offering': 'purple', 'Hired': 'teal', 'On Hold': 'gray', 'Cancelled': 'gray'
  }

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-5 gap-3">
        <KPICard label="Open positions"   value={open.length}   accent="bg-teal-400" />
        <KPICard label="Total hired YTD"  value={rec.filter(r=>r.status==='Hired').length} change="+2 vs Q1" changeType="up" accent="bg-blue-400" />
        <KPICard label="Avg time to hire" value="34 hr"         change="vs 38hr Q1"  changeType="up"   accent="bg-amber-400" />
        <KPICard label="Avg time to fill" value="52 hr"         change="above target" changeType="down" accent="bg-red-400" />
        <KPICard label="Total applicants" value={totalApplicants} accent="bg-purple-400" />
      </div>

      {/* Funnel + Source */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 card">
          <div className="card-head">
            <span className="card-title">Recruitment funnel — Q2 2026</span>
            <Badge variant="blue">{totalApplicants} total kandidat</Badge>
          </div>
          <div className="card-body">
            <FunnelRow label="Applicants" count={totalApplicants} total={totalApplicants} color="bg-navy-800" />
            <FunnelRow label="Screening"  count={totalScreening}  total={totalApplicants} color="bg-navy-600" />
            <FunnelRow label="Interview"  count={totalInterview}  total={totalApplicants} color="bg-teal-500" />
            <FunnelRow label="Offering"   count={totalOffering}   total={totalApplicants} color="bg-amber-500" />
            <FunnelRow label="Hired"      count={rec.filter(r=>r.status==='Hired').length} total={totalApplicants} color="bg-teal-600" />
          </div>
          <div className="grid grid-cols-3 border-t border-navy-100">
            {[
              {n:`${Math.round(rec.filter(r=>r.status==='Hired').length/Math.max(totalApplicants,1)*100)}%`, l:'Conversion rate', c:'text-teal-600'},
              {n:'Interview→Offer', l:'Bottleneck utama', c:'text-amber-600'},
              {n:'34 hr', l:'Avg time to hire', c:'text-blue-600'},
            ].map((s,i) => (
              <div key={i} className={cn('px-4 py-3 text-center', i>0 && 'border-l border-navy-100')}>
                <div className={`text-[15px] font-extrabold ${s.c}`}>{s.n}</div>
                <div className="text-[9.5px] text-navy-400 mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-2 card">
          <div className="card-head"><span className="card-title">Source of hire</span></div>
          <div className="card-body space-y-3">
            <InlineBar label="Job Portal" value="45%"  pct={45} color="bg-navy-800" />
            <InlineBar label="Referral"   value="30%"  pct={30} color="bg-teal-500" />
            <InlineBar label="LinkedIn"   value="25%"  pct={25} color="bg-blue-500" />
          </div>
          <div className="px-5 pb-5">
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5">
              <div className="text-[11px] font-bold text-teal-800 mb-1">💡 Referral 2x lebih efektif</div>
              <div className="text-[10.5px] text-teal-700 leading-relaxed">
                Conversion rate referral 2x lebih tinggi dari job portal. Formalisasikan program referral karyawan.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">Semua posisi</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-navy-50 border border-navy-100 rounded-lg px-2.5 py-1.5 w-44">
              <Search size={11} className="text-navy-400" />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari posisi..." className="bg-transparent text-[11px] outline-none w-full" />
            </div>
            <select value={fStatus} onChange={e=>setFStatus(e.target.value)} className="form-input !w-auto py-1.5 text-[11px]">
              <option value="">Semua status</option>
              {['Open','In Progress','Offering','Hired','On Hold','Cancelled'].map(s=><option key={s}>{s}</option>)}
            </select>
            <button onClick={()=>setShowModal(true)} className="btn btn-teal btn-sm">
              <Plus size={12} /> Buka posisi
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl" style={{minWidth:800}}>
            <thead><tr>
              <th>Posisi</th><th>Divisi</th><th>Source</th><th>Applicants</th>
              <th>Screening</th><th>Interview</th><th>Offering</th><th>Target</th><th>Status</th><th className="text-center">Aksi</th>
            </tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td className="font-bold">{r.position}</td>
                  <td className="text-[11px] text-navy-600">{r.division}</td>
                  <td><Badge variant="gray">{r.hiring_source ?? '–'}</Badge></td>
                  <td className="font-bold text-teal-600">{r.total_applicants}</td>
                  <td>{r.screening_count}</td><td>{r.interview_count}</td><td>{r.offering_count}</td>
                  <td className="text-[11px] text-navy-500">{fmtDate(r.target_date)}</td>
                  <td><Badge variant={statusColors[r.status] as any ?? 'gray'}>{r.status}</Badge></td>
                  <td className="text-center">
                    <button onClick={()=>deleteRec(r.id)} className="text-red-400 hover:text-red-600 text-[11px] font-bold px-2 py-1">Hapus</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <EmptyState message="Tidak ada data" />}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <Modal title="Buka posisi baru" onClose={()=>setShowModal(false)}>
          <div className="space-y-3">
            <div><label className="form-label">Nama posisi *</label><input value={form.position} onChange={e=>setForm(p=>({...p,position:e.target.value}))} className="form-input" placeholder="e.g. Social Media Specialist" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Divisi</label>
                <select value={form.division} onChange={e=>setForm(p=>({...p,division:e.target.value}))} className="form-input">
                  {['Creative','Marketing','Social Media','Human Capital','Finance','IT & Systems','Operations'].map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div><label className="form-label">Entitas</label>
                <select value={form.entity} onChange={e=>setForm(p=>({...p,entity:e.target.value}))} className="form-input">
                  <option>SSR</option><option>Nyambee (PAT)</option><option>PAT-5758</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Hiring source</label>
                <select value={form.hiring_source} onChange={e=>setForm(p=>({...p,hiring_source:e.target.value}))} className="form-input">
                  {['Job Portal','LinkedIn','Referral','Internal','Headhunter'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="form-label">Target hire date</label><input type="date" value={form.target_date} onChange={e=>setForm(p=>({...p,target_date:e.target.value}))} className="form-input" /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={()=>setShowModal(false)} className="btn btn-ghost">Batal</button>
              <button onClick={savePosition} disabled={saving} className="btn btn-teal">{saving?'Menyimpan...':'Simpan'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Insights */}
      <div className="grid grid-cols-2 gap-3">
        <InsightCard title="Bottleneck: Interview → Offering (33%)" text="Conversion dari interview ke offering sangat rendah. Kemungkinan salary ekspektasi tidak match. Rekomendasi: salary benchmarking dan fast-track approval." />
        <InsightCard title="Performance Marketer: time to fill 48hr" text="Posisi Performance Marketer butuh 48 hari untuk diisi — di atas target 30 hari. Perlu expand channel hiring ke platform yang lebih spesifik." color="bg-amber-700/80" titleColor="text-amber-200" />
      </div>
    </div>
  )
}
