import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/crypto'

function parseDate(val: any): string | null {
  if (!val) return null
  // Handle JS Date object (from XLSX parsing datetime cells)
  if (val instanceof Date) return val.toISOString().slice(0, 10)
  const s = String(val).trim()
  if (!s || s === '-') return null
  // Excel serial number
  if (/^\d{5}$/.test(s)) {
    const d = new Date((parseInt(s) - 25569) * 86400 * 1000)
    return d.toISOString().slice(0, 10)
  }
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split('/')
    return `${y}-${m}-${d}`
  }
  // ISO string from XLSX (e.g. "1984-11-18T00:00:00.000Z")
  if (s.includes('T')) return s.slice(0, 10)
  return s.slice(0, 10) || null
}

function normalizeStatus(val: any): string {
  const s = String(val || 'active').toLowerCase().trim()
  if (s === 'active' || s === 'aktif') return 'active'
  if (s === 'resigned' || s === 'resign') return 'resigned'
  if (s === 'end_contract' || s === 'end of contract' || s === 'end oc') return 'end_contract'
  return 'active'
}

export async function POST(req: NextRequest) {
  const db = createServiceClient()
  const { rows } = await req.json()

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
  }

  const results = []
  const errors  = []

  for (const row of rows) {
    const empId   = String(row['Employee ID'] || row['employee_id'] || '').trim()
    const rawName = String(row['Nama Lengkap'] || row['Nama'] || row['full_name'] || '').trim()

    if (!empId || !rawName) { errors.push(`Baris dilewati: Employee ID atau Nama kosong`); continue }

    const joinDate = parseDate(row['Join Date'] || row['join_date'])
    if (!joinDate) { errors.push(`${empId} (${rawName}): Join Date tidak valid — dilewati`); continue }

    const rawBirthDate = parseDate(row['Tgl Lahir'] || row['birth_date'])

    // Enkripsi kolom sensitif
    const [encName, encBirth] = await Promise.all([
      encrypt(rawName),
      rawBirthDate ? encrypt(rawBirthDate) : Promise.resolve(null),
    ])

    const payload: any = {
      employee_id:     empId,
      full_name:       encName,
      birth_date:      encBirth,
      email:           row['Email']              || row['email']           || null,
      position:        String(row['Posisi']      || row['position']        || '').trim(),
      level:           row['Level']              || row['level']           || null,
      division:        String(row['Divisi']      || row['division']        || '').trim(),
      entity:          String(row['Entitas']     || row['entity']          || 'SSR').trim(),
      employment_type: String(row['Tipe Kontrak']|| row['Tipe'] || row['employment_type'] || 'PKWTT').trim(),
      status:          normalizeStatus(row['Status'] || row['status']),
      gender:          row['Gender']             || row['gender']          || null,
      marital_status:  row['Status Pernikahan']  || row['marital_status']  || null,
      join_date:       joinDate,
      end_date:        parseDate(row['End Date'] || row['end_date']),
      notes:           row['Catatan']            || row['notes']           || null,
      work_location:   row['Lokasi']             || row['work_location']   || 'Jakarta',
    }

    // Hapus null values agar tidak override data existing saat upsert
    Object.keys(payload).forEach(k => { if (payload[k] === null || payload[k] === '') delete payload[k] })
    // Tapi tetap set field wajib
    payload.employee_id = empId
    payload.full_name   = encName
    payload.join_date   = joinDate
    if (encBirth) payload.birth_date = encBirth

    const { data, error } = await db
      .from('employees')
      .upsert(payload, { onConflict: 'employee_id' })
      .select()
      .maybeSingle()

    if (error) errors.push(`${empId} (${rawName}): ${error.message}`)
    else if (data) results.push(data)
  }

  return NextResponse.json({
    ok: true,
    count: results.length,
    skipped: errors.length,
    errors: errors.length > 0 ? errors : undefined,
  })
}

