'use client'
import { useState } from 'react'
import { Plus, Pencil, Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { KPICard, Badge, FunnelRow, InlineBar, InsightCard, EmptyState } from '@/components/ui'
import { fmtDate } from '@/lib/utils'
import Modal from '@/components/ui/Modal'

const EMPTY_REC = { position:'', division:'Creative', entity:'SSR', pic_name:'', hiring_source:'Job Portal', quarter:'Q2', year:2026, status:'Open', total_applicants:0, screening_count:0, interview_count:0, offering_count:0, target_date:'', notes:'' }
const STATUS_FLOW = ['Open','In Progress','Offering','Hired','On Hold','Cancelled']
const SC: Record<string,string> = { Open:'blue','In Progress':'amber', Offering:'purple', Hired:'teal','On Hold':'gray', Cancelled:'gray' }

export default function RecruitmentClient({ recruitment: init }: { recruitment: any[] }) {
  const [rec, setRec]           = useState(init)
  const [search, setSearch]     = useState('')
  const [fStatus, setFStatus]   = useState('')
  const [showModal, setShowModal]   = useState(false)
  const [editId, setEditId]     = useState<string|null>(null)
  const [saving, setSaving]     = useState(false)
  const [form, setForm]         = useState<any>(EMPTY_REC)
  const [expanded, setExpanded] = useState<string|null>(null)
  const fv = (k:string,v:any) => setForm((p:any)=>({...p,[k]:v}))

  const open = rec.filter(r=>['Open','In Progress','Offering'].includes(r.status))
  const totApp = open.reduce((s,r)=>s+r.total_applicants,0)
  const totScr = open.reduce((s,r)=>s+r.screening_count,0)
  const totInt = open.reduce((s,r)=>s+r.interview_count,0)
  const totOff = open.reduce((s,r)=>s+r.offering_count,0)

  const filtered = rec.filter(r=>
    (!search||r.position.toLowerCase().includes(search.toLowerCase())||r.division.toLowerCase().includes(search.toLowerCase()))&&
    (!fStatus||r.status===fStatus)
  )

  function openAdd() { setForm({...EMPTY_REC}); setEditId(null); setShowModal(true) }
  function openEdit(r:any) {
    setForm({ position:r.position, division:r.division, entity:r.entity, pic_name:r.pic_name||'',
      hiring_source:r.hiring_source||'Job Portal', quarter:r.quarter||'Q2', year:r.year||2026,
      status:r.status, total_applicants:r.total_applicants||0, screening_count:r.screening_count||0,
      interview_count:r.interview_count||0, offering_count:r.offering_count||0,
      target_date:r.target_date||'', notes:r.notes||'' })
    setEditId(r.id); setShowModal(true)
  }

  async function save() {
    if (!form.position) { alert('Nama posisi wajib diisi'); return }
    setSaving(true)
    try {
      if (editId) {
        const res = await fetch('/api/recruitment',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editId,...form})})
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setRec(prev=>prev.map(r=>r.id===editId?data.data:r))
      } else {
        const res = await fetch('/api/recruitment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setRec(prev=>[data.data,...prev])
      }
      setShowModal(false)
    } catch(err:any){alert('Error: '+err.message)}
    setSaving(false)
  }

  async function del(id:string) {
    if (!confirm('Hapus posisi ini?')) return
    await fetch(`/api/recruitment?id=${id}`,{method:'DELETE'})
    setRec(prev=>prev.filter(r=>r.id!==id))
  }

  async function updateStatus(id:string, status:string) {
    const res = await fetch('/api/recruitment',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status})})
    if (res.ok) setRec(prev=>prev.map(r=>r.id===id?{...r,status}:r))
  }

  async function updateCount(id:string, field:string, val:number) {
    const res = await fetch('/api/recruitment',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,[field]:val})})
    if (res.ok) setRec(prev=>prev.map(r=>r.id===id?{...r,[field]:val}:r))
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-5 gap-3">
        <KPICard label="Open positions"   value={open.length}                                   accent="bg-teal-400"/>
        <KPICard label="Hired YTD"        value={rec.filter(r=>r.status==='Hired').length} change="+2 vs Q1" changeType="up" accent="bg-blue-400"/>
        <KPICard label="Time to hire"     value="34 hr" change="vs 38hr Q1" changeType="up"    accent="bg-amber-400"/>
        <KPICard label="Time to fill"     value="52 hr" change="di atas target" changeType="down" accent="bg-red-400"/>
        <KPICard label="Total applicants" value={totApp}                                        accent="bg-purple-400"/>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 card">
          <div className="card-head"><span className="card-title">Recruitment funnel — posisi aktif</span><Badge variant="blue">{totApp} kandidat</Badge></div>
          <div className="card-body">
            <FunnelRow label="Applicants" count={totApp} total={totApp} color="bg-[#0f1e3d]"/>
            <FunnelRow label="Screening"  count={totScr} total={totApp} color="bg-[#1a2d5a]"/>
            <FunnelRow label="Interview"  count={totInt} total={totApp} color="bg-teal-500"/>
            <FunnelRow label="Offering"   count={totOff} total={totApp} color="bg-amber-500"/>
            <FunnelRow label="Hired"      count={rec.filter(r=>r.status==='Hired').length} total={totApp} color="bg-teal-600"/>
          </div>
        </div>
        <div className="col-span-2 card">
          <div className="card-head"><span className="card-title">Source of hire</span></div>
          <div className="card-body space-y-2">
            <InlineBar label="Job Portal" value="45%" pct={45} color="bg-[#0f1e3d]"/>
            <InlineBar label="Referral"   value="30%" pct={30} color="bg-teal-500"/>
            <InlineBar label="LinkedIn"   value="25%" pct={25} color="bg-blue-500"/>
          </div>
          <div className="px-5 pb-5">
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5">
              <div className="text-[11px] font-bold text-teal-800 mb-1">💡 Hanya input kandidat yang sudah lewat screening HC</div>
              <div className="text-[10.5px] text-teal-700">Update jumlah di tiap tahap funnel langsung dari tabel di bawah. Klik angka untuk edit.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="flex items-center gap-3">
            <span className="card-title">Semua posisi</span>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 w-44">
              <Search size={11} className="text-slate-300"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari posisi..." className="bg-transparent text-[11px] outline-none w-full"/>
            </div>
            <select value={fStatus} onChange={e=>setFStatus(e.target.value)} className="form-input !w-auto py-1.5 text-[11px]">
              <option value="">Semua status</option>
              {STATUS_FLOW.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <button onClick={openAdd} className="btn btn-teal btn-sm"><Plus size={12}/> Buka posisi</button>
        </div>
        <table className="tbl">
          <thead><tr>
            <th>Posisi</th><th>Divisi</th><th>PIC HC</th><th>Source</th>
            <th className="text-center">Applicant</th><th className="text-center">Screening</th>
            <th className="text-center">Interview</th><th className="text-center">Offering</th>
            <th>Target</th><th>Status</th><th className="text-center">Aksi</th>
          </tr></thead>
          <tbody>
            {filtered.map(r=>(
              <>
                <tr key={r.id}>
                  <td>
                    <div className="font-bold text-[12px]">{r.position}</div>
                    <div className="text-[10px] text-slate-300">{r.entity}</div>
                  </td>
                  <td className="text-[11px] text-slate-600">{r.division}</td>
                  <td className="text-[11px] text-slate-400">{r.pic_name||'–'}</td>
                  <td><Badge variant="gray">{r.hiring_source??'–'}</Badge></td>
                  {(['total_applicants','screening_count','interview_count','offering_count'] as const).map(field=>(
                    <td key={field} className="text-center">
                      <input
                        type="number" min={0}
                        value={r[field]}
                        onChange={e=>updateCount(r.id,field,parseInt(e.target.value)||0)}
                        className="w-12 text-center text-[12px] font-bold bg-slate-50 border border-slate-100 rounded-lg py-1 outline-none focus:border-teal-400"
                      />
                    </td>
                  ))}
                  <td className="text-[11px] text-slate-400">{fmtDate(r.target_date)}</td>
                  <td>
                    <select value={r.status} onChange={e=>updateStatus(r.id,e.target.value)}
                      className={`badge border cursor-pointer outline-none bg-transparent text-[9.5px] font-bold appearance-none badge-${SC[r.status]??'gray'}`}>
                      {STATUS_FLOW.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td><div className="flex items-center justify-center gap-1">
                    <button onClick={()=>setExpanded(expanded===r.id?null:r.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-teal-50 hover:text-teal-600 text-slate-400">
                      {expanded===r.id?<ChevronUp size={12}/>:<ChevronDown size={12}/>}
                    </button>
                    <button onClick={()=>openEdit(r)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400"><Pencil size={12}/></button>
                    <button onClick={()=>del(r.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-red-50 hover:text-red-600 text-slate-400"><Trash2 size={12}/></button>
                  </div></td>
                </tr>
                {expanded===r.id&&(
                  <tr key={r.id+'_notes'}>
                    <td colSpan={11} className="bg-slate-50 px-5 py-3">
                      <div className="text-[11px] font-bold text-slate-600 mb-1">Catatan posisi:</div>
                      <div className="text-[11px] text-slate-500">{r.notes||'Belum ada catatan.'}</div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filtered.length===0&&<EmptyState message="Tidak ada posisi"/>}
          </tbody>
        </table>
      </div>

      {showModal&&(
        <Modal title={editId?'Edit posisi':'Buka posisi baru'} onClose={()=>setShowModal(false)} size="lg">
          <div className="space-y-3">
            <div><label className="form-label">Nama posisi *</label><input value={form.position} onChange={e=>fv('position',e.target.value)} className="form-input" placeholder="e.g. Social Media Specialist"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Divisi</label>
                <select value={form.division} onChange={e=>fv('division',e.target.value)} className="form-input">
                  {['Creative','Marketing','Social Media','Human Capital','Finance','IT & Systems','Operations'].map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div><label className="form-label">Entitas</label>
                <select value={form.entity} onChange={e=>fv('entity',e.target.value)} className="form-input">
                  <option>SSR</option><option>Nyambee (PAT)</option><option>PAT-5758</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">PIC HR</label><input value={form.pic_name} onChange={e=>fv('pic_name',e.target.value)} className="form-input" placeholder="Nama HR yang handle"/></div>
              <div><label className="form-label">Source hiring</label>
                <select value={form.hiring_source} onChange={e=>fv('hiring_source',e.target.value)} className="form-input">
                  {['Job Portal','LinkedIn','Referral','Internal','Headhunter'].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Quarter</label>
                <select value={form.quarter} onChange={e=>fv('quarter',e.target.value)} className="form-input">
                  <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
                </select>
              </div>
              <div><label className="form-label">Status</label>
                <select value={form.status} onChange={e=>fv('status',e.target.value)} className="form-input">
                  {STATUS_FLOW.map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="form-label">Target hire date</label><input type="date" value={form.target_date} onChange={e=>fv('target_date',e.target.value)} className="form-input"/></div>
              <div><label className="form-label">Jumlah applicant awal</label><input type="number" value={form.total_applicants} onChange={e=>fv('total_applicants',parseInt(e.target.value)||0)} className="form-input" min={0}/></div>
            </div>
            <div><label className="form-label">Catatan</label><textarea value={form.notes} onChange={e=>fv('notes',e.target.value)} className="form-input h-16 resize-none" placeholder="Info tambahan tentang posisi ini..."/></div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={()=>setShowModal(false)} className="btn btn-ghost">Batal</button>
              <button onClick={save} disabled={saving} className="btn btn-teal">{saving?'Menyimpan...':editId?'Update':'Buka posisi'}</button>
            </div>
          </div>
        </Modal>
      )}

      <div className="grid grid-cols-2 gap-3">
        <InsightCard title="Update funnel langsung dari tabel" text="Klik angka di kolom Applicant / Screening / Interview / Offering untuk update langsung. Status posisi bisa diubah dari dropdown di kolom Status."/>
        <InsightCard title="Referral 2x lebih efektif" text="Conversion rate referral 2x lebih tinggi dari job portal. Formalisasikan program referral dengan insentif untuk karyawan yang rekomendasikan kandidat berhasil." color="bg-teal-700" titleColor="text-teal-200"/>
      </div>
    </div>
  )
}
