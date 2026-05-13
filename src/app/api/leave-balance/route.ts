import { decryptMany } from '@/lib/crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const DEC = [{ key: 'full_name', type: 'string' as const }]
const SEL = '*, employee:employees(full_name,division,join_date,employment_type)'

async function decOne(row: any) {
  if (!row) return row
  return { ...row, employee: row.employee ? (await decryptMany([row.employee], DEC))[0] : row.employee }
}
async function decMany(rows: any[]) {
  return Promise.all((rows ?? []).map(decOne))
}

export async function GET(req: NextRequest) {
  const db = createServiceClient()
  const year  = req.nextUrl.searchParams.get('year') ?? new Date().getFullYear().toString()
  const empId = req.nextUrl.searchParams.get('employee_id')
  let q = db.from('leave_balance').select(SEL).eq('year', parseInt(year)).order('created_at', { ascending: false })
  if (empId) q = q.eq('employee_id', empId)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: await decMany(data ?? []) })
}

export async function POST(req: NextRequest) {
  const db   = createServiceClient()
  const body = await req.json()
  if (body.overtime_entitled !== undefined && body.overtime_entitled > 0) {
    body.ot_granted_at = new Date().toISOString()
  }

  // Cek apakah sudah ada record — kalau ada pakai UPDATE, kalau tidak INSERT
  const { data: existing } = await db.from('leave_balance')
    .select('id').eq('employee_id', body.employee_id).eq('year', body.year).maybeSingle()

  let data, error
  if (existing?.id) {
    // Update existing
    const { id: _, ...upd } = body
    ;({ data, error } = await db.from('leave_balance').update(upd).eq('id', existing.id).select(SEL).maybeSingle())
  } else {
    // Insert new
    ;({ data, error } = await db.from('leave_balance').insert(body).select(SEL).maybeSingle())
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: await decOne(data) })
}

export async function PATCH(req: NextRequest) {
  const db = createServiceClient()
  const { id, ...body } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  if (body.overtime_entitled !== undefined && body.overtime_entitled > 0) {
    body.ot_granted_at = new Date().toISOString()
  }
  const { data, error } = await db.from('leave_balance').update(body).eq('id', id).select(SEL).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: await decOne(data) })
}

export async function DELETE(req: NextRequest) {
  const db = createServiceClient()
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await db.from('leave_balance').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
