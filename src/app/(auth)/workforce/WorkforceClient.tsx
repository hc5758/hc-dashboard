'use client'
import { useState, useRef } from 'react'
import { Search, Download, Upload } from 'lucide-react'
import { KPICard, Badge, StatusBadge, Avatar, InlineBar, InsightCard, EmptyState } from '@/components/ui'
import { fmtDate, calcYoS, statusLabel, cn } from '@/lib/utils'
import * as XLSX from 'xlsx'

export default function WorkforceClient({ employees: init }: { employees: any[] }) {
  const [employees, setEmployees] = useState(init)
  const [search, setSearch] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [fEntity, setFEntity] = useState('')
  const [fDiv, setFDiv] = useState('')
  const [msg, setMsg] = useState('')
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const active = employees.filter(e => e.status === 'active')
  const divs = Array.from(new Set(employees.map(e => e.division))).sort()
  const entities = Array.from(new Set(employees.map(e => e.entity))).sort()

  const filtered = employees.filter(e =>
    (!search || e.full_name.toLowerCase().includes(search.toLowerCase()) || e.employee_id.toLowerCase().includes(search.toLowerCase())) &&
    (!fStatus || e.status === fStatus) && (!fEntity || e.entity === fEntity) && (!fDiv || e.division === fDiv)
  )

  const divCounts = Object.entries(active.reduce((acc: any, e) => { acc[e.division] = (acc[e.division] || 0) + 1; return acc }, {})).sort((a: any, b: any) => b[1] - a[1])
  const maxDiv = (divCounts[0]?.[1] as number) || 1

  function handleExport() {
    const rows = filtered.map(e => ({
      'Employee ID': e.employee_id, 'Nama': e.full_name, 'Email': e.email ?? '',
      'Posisi': e.position, 'Level': e.level ?? '', 'Divisi': e.division,
      'Entitas': e.entity, 'Tipe': e.employment_type, 'Status': statusLabel(e.status),
      'Gender': e.gender ?? '', 'Join Date': e.join_date, 'End Date': e.end_date ?? '',
      'Masa Kerja': calcYoS(e.join_date),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Karyawan')
    XLSX.writeFile(wb, `karyawan-5758-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setImporting(true); setMsg('Membaca file...')
    try {
      const buf = await file.arrayBuffer()
      const wb = XLSX.read(buf)
      const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
      setMsg(`${rows.length} baris ditemukan. Mengupload...`)
      const res = await fetch('/api/upload/employees', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMsg(`✓ ${data.count} karyawan berhasil diimport!`)
      const fresh = await fetch('/api/employees').then(r => r.json())
      if (fresh.data) setEmployees(fresh.data)
    } catch (err: any) {
      setMsg(`✗ Error: ${err.message}`)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
      setTimeout(() => setMsg(''), 5000)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-3">
        <KPICard label="Total karyawan"  value={employees.length}                                     accent="bg-navy-600" />
        <KPICard label="Aktif"           value={active.length}                        change="+3 MoM" changeType="up"   accent="bg-teal-400" />
        <KPICard label="PKWTT (tetap)"   value={active.filter(e => e.employment_type === 'PKWTT').length} accent="bg-blue-400" />
        <KPICard label="PKWT (kontrak)"  value={active.filter(e => e.employment_type === 'PKWT').length}  accent="bg-amber-400" />
        <KPICard label="Resign + End OC" value={employees.filter(e => e.status !== 'active').length}  accent="bg-red-400" />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card">
          <div className="card-head"><span className="card-title">By division</span></div>
          <div className="card-body space-y-2">
            {divCounts.slice(0, 8).map(([div, count]) => (
              <InlineBar key={div} label={div as string} value={`${count}`} pct={Math.round((count as number / maxDiv) * 100)} color="bg-navy-800" />
            ))}
          </div>
        </div>

        <div className="col-span-3 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white border border-navy-100 rounded-lg px-3 py-1.5 flex-1 min-w-[180px]">
              <Search size={12} className="text-navy-300" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama atau ID..." className="bg-transparent text-[11.5px] outline-none w-full text-navy-800 placeholder:text-navy-300" />
            </div>
            <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="form-input !w-auto py-1.5 text-[11px]">
              <option value="">Semua status</option>
              <option value="active">Aktif</option><option value="resigned">Resign</option><option value="end_contract">End OC</option>
            </select>
            <select value={fEntity} onChange={e => setFEntity(e.target.value)} className="form-input !w-auto py-1.5 text-[11px]">
              <option value="">Semua entitas</option>
              {entities.map(en => <option key={en}>{en}</option>)}
            </select>
            <select value={fDiv} onChange={e => setFDiv(e.target.value)} className="form-input !w-auto py-1.5 text-[11px]">
              <option value="">Semua divisi</option>
              {divs.map(d => <option key={d}>{d}</option>)}
            </select>
            <div className="ml-auto flex items-center gap-2">
              {msg && <span className={cn('text-[10.5px] font-medium', msg.startsWith('✓') ? 'text-teal-600' : msg.startsWith('✗') ? 'text-red-600' : 'text-amber-600')}>{msg}</span>}
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" />
              <button onClick={() => fileRef.current?.click()} disabled={importing} className="btn btn-ghost btn-sm"><Upload size={12} /> Import Excel</button>
              <button onClick={handleExport} className="btn btn-ghost btn-sm"><Download size={12} /> Export</button>
            </div>
          </div>
          <div className="text-[10.5px] text-navy-300">Menampilkan <strong className="text-navy-800">{filtered.length}</strong> dari {employees.length} karyawan</div>
          <div className="card overflow-x-auto">
            <table className="tbl" style={{ minWidth: 800 }}>
              <thead><tr><th>Karyawan</th><th>Posisi</th><th>Divisi</th><th>Entitas</th><th>Kontrak</th><th>Status</th><th>Join date</th><th>Masa kerja</th><th>End date</th></tr></thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={e.full_name} size="sm" />
                        <div><div className="font-bold text-[12px]">{e.full_name}</div><div className="text-[10px] text-navy-300">{e.employee_id}</div></div>
                      </div>
                    </td>
                    <td className="text-[11px] text-navy-600">{e.position}</td>
                    <td className="text-[11px]">{e.division}</td>
                    <td><Badge variant="navy">{e.entity}</Badge></td>
                    <td><Badge variant={e.employment_type === 'PKWTT' ? 'teal' : 'blue'}>{e.employment_type}</Badge></td>
                    <td><StatusBadge status={e.status} /></td>
                    <td className="text-[11px] text-navy-400">{fmtDate(e.join_date)}</td>
                    <td className="text-[11px]">{calcYoS(e.join_date)}</td>
                    <td className={cn('text-[11px]', e.end_date && new Date(e.end_date) < new Date(Date.now() + 30 * 86400000) ? 'text-red-600 font-bold' : 'text-navy-400')}>
                      {fmtDate(e.end_date) || '–'}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <EmptyState message="Tidak ada data yang sesuai filter" />}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InsightCard title="Creative division terbesar (15 orang)" text="37% dari total headcount aktif ada di Creative. Perlu monitoring beban kerja dan retention strategy khusus." />
        <InsightCard title="Gender split 59% Perempuan" text="Distribusi gender cukup seimbang. Perempuan mayoritas di Creative dan Social Media, Laki-laki di Operations dan IT." color="bg-navy-600" titleColor="text-teal-200" />
      </div>
    </div>
  )
}
