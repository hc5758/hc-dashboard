'use client'
import { useState, useRef } from 'react'
import { Employee } from '@/types'
import { formatDate, calcYoS, getInitials, getAvatarColor, getStatusBadgeClass } from '@/lib/utils'
import { Search, Upload, Download, Plus, Filter, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/client'

interface Props { employees: Employee[] }

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif', inactive: 'Tidak Aktif', resigned: 'Resign', end_contract: 'End OC'
}

export default function KaryawanTable({ employees: initial }: Props) {
  const [employees, setEmployees] = useState(initial)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterEntity, setFilterEntity] = useState('all')
  const [filterDivision, setFilterDivision] = useState('all')
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const divisions = [...new Set(employees.map(e => e.division))].sort()
  const entities = [...new Set(employees.map(e => e.entity))].sort()

  const filtered = employees.filter(e => {
    const matchSearch = !search ||
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      e.employee_id.toLowerCase().includes(search.toLowerCase()) ||
      e.division.toLowerCase().includes(search.toLowerCase()) ||
      e.position.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || e.status === filterStatus
    const matchEntity = filterEntity === 'all' || e.entity === filterEntity
    const matchDiv = filterDivision === 'all' || e.division === filterDivision
    return matchSearch && matchStatus && matchEntity && matchDiv
  })

  // Export to Excel
  function handleExport() {
    const rows = filtered.map(e => ({
      'Employee ID': e.employee_id,
      'Nama Lengkap': e.full_name,
      'Email': e.email || '',
      'No HP': e.phone || '',
      'Posisi': e.position,
      'Level': e.level || '',
      'Divisi': e.division,
      'Entitas': e.entity,
      'Tipe Kontrak': e.employment_type,
      'Lokasi Kerja': e.work_location || '',
      'Status': STATUS_LABELS[e.status] || e.status,
      'Gender': e.gender || '',
      'Tgl Lahir': e.birth_date || '',
      'Status Nikah': e.marital_status || '',
      'Tgl Bergabung': e.join_date,
      'Tgl Berakhir Kontrak': e.end_date || '',
      'Masa Kerja': calcYoS(e.join_date),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Karyawan')
    XLSX.writeFile(wb, `data-karyawan-5758-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Import from Excel
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportMsg('Membaca file Excel...')

    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(ws)

      setImportMsg(`Menemukan ${rows.length} baris. Memproses...`)

      const supabase = createClient()
      const toUpsert = rows.map(row => ({
        employee_id: String(row['Employee ID'] || row['employee_id'] || '').trim(),
        full_name: String(row['Nama Lengkap'] || row['full_name'] || '').trim(),
        email: row['Email'] || row['email'] || null,
        phone: row['No HP'] || row['phone'] || null,
        position: String(row['Posisi'] || row['position'] || '').trim(),
        level: row['Level'] || row['level'] || null,
        division: String(row['Divisi'] || row['division'] || '').trim(),
        entity: String(row['Entitas'] || row['entity'] || 'SSR').trim(),
        employment_type: String(row['Tipe Kontrak'] || row['employment_type'] || 'PKWTT').trim(),
        work_location: row['Lokasi Kerja'] || row['work_location'] || 'Jakarta',
        status: 'active',
        gender: row['Gender'] || row['gender'] || null,
        birth_date: row['Tgl Lahir'] || row['birth_date'] || null,
        marital_status: row['Status Nikah'] || row['marital_status'] || null,
        join_date: row['Tgl Bergabung'] || row['join_date'],
        end_date: row['Tgl Berakhir Kontrak'] || row['end_date'] || null,
      })).filter(r => r.employee_id && r.full_name && r.join_date)

      const { data, error } = await supabase
        .from('employees')
        .upsert(toUpsert, { onConflict: 'employee_id' })
        .select()

      if (error) throw error

      setImportMsg(`✓ Berhasil import ${toUpsert.length} karyawan!`)
      // Refresh data
      const { data: fresh } = await supabase.from('employees').select('*').order('full_name')
      if (fresh) setEmployees(fresh)

    } catch (err: any) {
      setImportMsg(`✗ Error: ${err.message}`)
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
      setTimeout(() => setImportMsg(''), 4000)
    }
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 bg-white border border-[#e2e8f4] rounded-lg px-2.5 py-1.5 w-52">
          <Search size={11} className="text-[#96a4be]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama, ID, divisi..."
            className="bg-transparent text-[11px] outline-none w-full text-[#0f1e3d] placeholder:text-[#96a4be]" />
          {search && <button onClick={() => setSearch('')}><X size={10} className="text-[#96a4be]" /></button>}
        </div>

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="text-[11px] bg-white border border-[#e2e8f4] rounded-lg px-2.5 py-1.5 outline-none text-[#0f1e3d]">
          <option value="all">Semua status</option>
          <option value="active">Aktif</option>
          <option value="resigned">Resign</option>
          <option value="end_contract">End OC</option>
          <option value="inactive">Tidak Aktif</option>
        </select>

        <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)}
          className="text-[11px] bg-white border border-[#e2e8f4] rounded-lg px-2.5 py-1.5 outline-none text-[#0f1e3d]">
          <option value="all">Semua entitas</option>
          {entities.map(en => <option key={en} value={en}>{en}</option>)}
        </select>

        <select value={filterDivision} onChange={e => setFilterDivision(e.target.value)}
          className="text-[11px] bg-white border border-[#e2e8f4] rounded-lg px-2.5 py-1.5 outline-none text-[#0f1e3d]">
          <option value="all">Semua divisi</option>
          {divisions.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <div className="ml-auto flex items-center gap-2">
          {importMsg && (
            <span className={`text-[10.5px] font-medium ${importMsg.startsWith('✓') ? 'text-teal-600' : importMsg.startsWith('✗') ? 'text-red-600' : 'text-amber-600'}`}>
              {importMsg}
            </span>
          )}
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImport}
            className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={importing}
            className="btn-secondary">
            <Upload size={11} />
            Import Excel
          </button>
          <button onClick={handleExport} className="btn-secondary">
            <Download size={11} />
            Export
          </button>
          <button className="btn-primary">
            <Plus size={11} />
            Tambah karyawan
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-2 text-[10.5px] text-[#5a6a8a]">
        <span>Menampilkan <strong className="text-[#0f1e3d]">{filtered.length}</strong> dari {employees.length} karyawan</span>
        <span>·</span>
        <span className="text-teal-700 font-semibold">{filtered.filter(e => e.status === 'active').length} aktif</span>
        <span>·</span>
        <span className="text-red-600 font-semibold">{filtered.filter(e => e.status === 'resigned').length} resign</span>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full" style={{ tableLayout: 'fixed', minWidth: '900px' }}>
          <thead>
            <tr>
              <th className="table-th w-[120px]">Karyawan</th>
              <th className="table-th w-[90px]">Posisi</th>
              <th className="table-th w-[80px]">Divisi</th>
              <th className="table-th w-[75px]">Entitas</th>
              <th className="table-th w-[60px]">Kontrak</th>
              <th className="table-th w-[60px]">Status</th>
              <th className="table-th w-[65px]">Join date</th>
              <th className="table-th w-[70px]">Masa kerja</th>
              <th className="table-th w-[80px]">Tgl berakhir</th>
              <th className="table-th w-[55px]">Gender</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id} className="hover:bg-[#fafbfe] cursor-pointer group">
                <td className="table-td">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8.5px]
                                     font-bold flex-shrink-0 ${getAvatarColor(e.full_name)}`}>
                      {getInitials(e.full_name)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-[11px] truncate">{e.full_name}</div>
                      <div className="text-[9px] text-[#96a4be]">{e.employee_id}</div>
                    </div>
                  </div>
                </td>
                <td className="table-td text-[10.5px] truncate">{e.position}</td>
                <td className="table-td text-[10.5px] truncate">{e.division}</td>
                <td className="table-td">
                  <span className="badge badge-gray text-[8.5px]">{e.entity}</span>
                </td>
                <td className="table-td">
                  <span className={`badge ${e.employment_type === 'PKWTT' ? 'badge-teal' : 'badge-blue'}`}>
                    {e.employment_type}
                  </span>
                </td>
                <td className="table-td">
                  <span className={`badge ${getStatusBadgeClass(e.status)}`}>
                    {STATUS_LABELS[e.status] || e.status}
                  </span>
                </td>
                <td className="table-td text-[#5a6a8a]">{formatDate(e.join_date)}</td>
                <td className="table-td text-[10.5px]">{calcYoS(e.join_date)}</td>
                <td className="table-td text-[10.5px]">
                  {e.end_date
                    ? <span className={`font-medium ${new Date(e.end_date) < new Date() ? 'text-red-600' : 'text-amber-600'}`}>
                        {formatDate(e.end_date)}
                      </span>
                    : <span className="text-[#96a4be]">–</span>
                  }
                </td>
                <td className="table-td text-[10.5px] text-[#5a6a8a]">{e.gender || '–'}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="table-td text-center py-8 text-[#96a4be]">
                Tidak ada data yang sesuai filter
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
