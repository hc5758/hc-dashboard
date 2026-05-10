import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Normalize tanggal dari Supabase — pastikan format YYYY-MM-DD bukan ISO timestamp
function normalizeDates(row: any) {
  if (!row) return row
  const dateFields = ['start_date', 'end_date']
  const result = { ...row }
  dateFields.forEach(f => {
    if (result[f] && result[f].length > 10) {
      result[f] = result[f].slice(0, 10)
    }
  })
  return result
}

export async function GET() {
  const db = createServiceClient()
  const { data, error } = await db
    .from('attendance_leave')
    .select('*, employee:employees(full_name, division, gender)')
    .order('start_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: (data ?? []).map(normalizeDates) })
}

export async function POST(req: NextRequest) {
  const db = createServiceClient()
  const body = await req.json()
  const { data, error } = await db
    .from('attendance_leave')
    .insert(body)
    .select('*, employee:employees(full_name, division, gender)')
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: normalizeDates(data) })
}

export async function PATCH(req: NextRequest) {
  const db = createServiceClient()
  const { id, ...body } = await req.json()
  const { data, error } = await db
    .from('attendance_leave')
    .update(body)
    .eq('id', id)
    .select('*, employee:employees(full_name, division, gender)')
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: normalizeDates(data) })
}

export async function DELETE(req: NextRequest) {
  const db = createServiceClient()
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await db.from('attendance_leave').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
