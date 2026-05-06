import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/upload/employees
// Body: { rows: any[] } — rows from parsed Excel
export async function POST(req: NextRequest) {
  const db = createServiceClient()
  const { rows } = await req.json()

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
  }

  const mapped = rows.map((row: any) => ({
    employee_id: String(row['Employee ID'] || row['employee_id'] || '').trim(),
    full_name:   String(row['Nama'] || row['Nama Lengkap'] || row['full_name'] || '').trim(),
    email:       row['Email'] || row['email'] || null,
    phone:       row['No HP'] || row['phone'] || null,
    position:    String(row['Posisi'] || row['position'] || '').trim(),
    level:       row['Level'] || row['level'] || null,
    division:    String(row['Divisi'] || row['division'] || '').trim(),
    entity:      String(row['Entitas'] || row['entity'] || 'SSR').trim(),
    employment_type: String(row['Tipe'] || row['Tipe Kontrak'] || row['employment_type'] || 'PKWTT').trim(),
    work_location:   row['Lokasi Kerja'] || row['work_location'] || 'Jakarta',
    gender:          row['Gender'] || row['gender'] || null,
    birth_date:      row['Tgl Lahir'] || row['birth_date'] || null,
    marital_status:  row['Status Nikah'] || row['marital_status'] || null,
    join_date:       row['Join Date'] || row['Tgl Bergabung'] || row['join_date'] || null,
    end_date:        row['End Date'] || row['Tgl Berakhir'] || row['end_date'] || null,
    status: 'active',
  })).filter(r => r.employee_id && r.full_name && r.join_date)

  if (mapped.length === 0) {
    return NextResponse.json({ error: 'Tidak ada baris valid. Pastikan kolom Employee ID, Nama, dan Join Date ada.' }, { status: 400 })
  }

  const { data, error } = await db.from('employees')
    .upsert(mapped, { onConflict: 'employee_id' })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log activity
  await db.from('activity_log').insert({
    action: 'import_excel',
    table_name: 'employees',
    description: `Import Excel: ${mapped.length} karyawan diupsert`,
  })

  return NextResponse.json({ ok: true, count: data?.length ?? mapped.length })
}
