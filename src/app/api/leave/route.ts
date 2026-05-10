import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Normalize tanggal dari Supabase — pastikan format YYYY-MM-DD
function normalizeDates(row: any) {
  if (!row) return row
  const result = { ...row }
  ;['start_date','end_date'].forEach(f => {
    if (result[f] && result[f].length > 10) result[f] = result[f].slice(0, 10)
  })
  return result
}

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
}

export async function GET() {
  const db = createServiceClient()
  const { data, error } = await db
    .from('attendance_leave')
    .select('*, employee:employees(full_name, division, gender)')
    .order('start_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: (data ?? []).map(normalizeDates) }, { headers: NO_CACHE })
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
  return NextResponse.json({ data: normalizeDates(data) }, { headers: NO_CACHE })
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
  return NextResponse.json({ data: normalizeDates(data) }, { headers: NO_CACHE })
}

export async function DELETE(req: NextRequest) {
  const db = createServiceClient()
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await db.from('attendance_leave').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true }, { headers: NO_CACHE })
}
