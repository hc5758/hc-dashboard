import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const db = createServiceClient()
  const { data, error } = await db.from('onboarding')
    .select('*, employee:employees(full_name,position,division)')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const db = createServiceClient()
  const { id, employee_id, ...body } = await req.json()

  if (id) {
    // Update by id
    const { data, error } = await db.from('onboarding').update(body).eq('id', id).select().maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (employee_id) {
    // Update by employee_id — find record first
    const { data: existing } = await db.from('onboarding')
      .select('id').eq('employee_id', employee_id).maybeSingle()
    if (existing?.id) {
      const { data, error } = await db.from('onboarding').update(body).eq('id', existing.id).select().maybeSingle()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data })
    }
    // Create new if not exist
    const { data, error } = await db.from('onboarding').insert({ employee_id, ...body }).select().maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Missing id or employee_id' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const db = createServiceClient()
  const body = await req.json()
  const { data, error } = await db.from('onboarding').insert(body).select().maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
