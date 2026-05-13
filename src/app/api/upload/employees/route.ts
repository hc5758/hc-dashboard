import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/crypto'

function parseDate(val: any): string | null {
  if (!val) return null
  if (val instanceof Date) return `${val.getFullYear()}-${String(val.getMonth()+1).padStart(2,'0')}-${String(val.getDate()).padStart(2,'0')}`
  const s = String(val).trim()
  if (!s || s === '-') return null
  if (s.includes('T')) return s.slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) { const [d,m,y]=s.split('/'); return `${y}-${m}-${d}` }
  if (/^\d{5}$/.test(s)) { const d=new Date((parseInt(s)-25569)*86400*1000); return d.toISOString().slice(0,10) }
  return null
}

function normalizeStatus(val: any): string {
  const s = String(val || 'active').toLowerCase().trim()
  if (s==='active'||s==='aktif') return 'active'
  if (s==='resigned'||s==='resign') return 'resigned'
  if (s==='end_contract'||s==='end of contract'||s==='end oc') return 'end_contract'
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
    if (!joinDate) { errors.push(`${empId} (${rawName}): Join Date tidak valid`); continue }

    // Hanya full_name yang dienkripsi — birth_date plain (tipe date di DB)
    const encName = await encrypt(rawName)

    const payload: Record<string,any> = {
      employee_id:     empId,
      full_name:       encName,
      email:           row['Email']              || null,
      position:        String(row['Posisi']      || '').trim(),
      level:           row['Level']              || null,
      division:        String(row['Divisi']      || '').trim(),
      entity:          String(row['Entitas']     || 'SSR').trim(),
      employment_type: String(row['Tipe Kontrak']|| row['Tipe'] || 'PKWTT').trim(),
      status:          normalizeStatus(row['Status']),
      gender:          row['Gender']             || null,
      marital_status:  row['Status Pernikahan']  || null,
      birth_date:      parseDate(row['Tgl Lahir'] || row['birth_date']),  // plain — tipe date di DB
      join_date:       joinDate,
      end_date:        parseDate(row['End Date'] || row['end_date']),
      notes:           row['Catatan']            || null,
      work_location:   row['Lokasi']             || 'Jakarta',
    }

    // Hapus null agar tidak override data existing
    Object.keys(payload).forEach(k => { if (payload[k] === null || payload[k] === '') delete payload[k] })
    payload.employee_id = empId
    payload.full_name   = encName
    payload.join_date   = joinDate
    if (payload.birth_date === undefined && parseDate(row['Tgl Lahir'])) {
      payload.birth_date = parseDate(row['Tgl Lahir'])
    }

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
