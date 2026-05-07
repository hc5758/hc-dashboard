import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const db = createServiceClient()
  const year = req.nextUrl.searchParams.get('year') ?? '2026'
  const empId = req.nextUrl.searchParams.get('employee_id')
  let q = db.from('leave_balance')
    .select('*, employee:employees(full_name,division,join_date,employment_type)')
    .eq('year', parseInt(year))
    .order('created_at', { ascending: false })
  if (empId) q = q.eq('employee_id', empId)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const db = createServiceClient()
  const body = await req.json()
  const { data, error } = await db.from('leave_balance')
    .upsert(body, { onConflict: 'employee_id,year' })
    .select('*, employee:employees(full_name,division,join_date,employment_type)')
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const db = createServiceClient()
  const { id, ...body } = await req.json()
  const { data, error } = await db.from('leave_balance').update(body).eq('id', id)
    .select('*, employee:employees(full_name,division,join_date,employment_type)')
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const db = createServiceClient()
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await db.from('leave_balance').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
