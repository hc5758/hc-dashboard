import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { decryptMany } from '@/lib/crypto'

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

const DEC = [{ key: 'full_name', type: 'string' as const }]

async function decryptLeave(rows: any[]) {
  return Promise.all(rows.map(async (r) => {
    const norm = normalizeDates(r)
    return {
      ...norm,
      employee: norm.employee ? (await decryptMany([norm.employee], DEC))[0] : norm.employee
    }
  }))
}

export async function GET() {
  const db = createServiceClient()
  const { data, error } = await db
    .from('attendance_leave')
    .select('*, employee:employees(full_name, division, gender)')
    .order('start_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const decrypted = await decryptLeave(data ?? [])
  return NextResponse.json({ data: decrypted }, { headers: NO_CACHE })
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
  const [dec] = data ? await decryptLeave([data]) : [data]
  return NextResponse.json({ data: dec }, { headers: NO_CACHE })
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
  const [dec] = data ? await decryptLeave([data]) : [data]
  return NextResponse.json({ data: dec }, { headers: NO_CACHE })
}

export async function DELETE(req: NextRequest) {
  const db = createServiceClient()
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await db.from('attendance_leave').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true }, { headers: NO_CACHE })
}
