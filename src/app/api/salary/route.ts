import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { encryptFields, decryptFields, decryptMany } from '@/lib/crypto'

// Semua kolom finansial dienkripsi
const NUM_FIELDS = [
  'basic_salary','allowance','overtime','bonus','deduction',
  'bpjs_ketenagakerjaan','bpjs_kesehatan','pph21','net_salary'
] as const

const DEC_FIELDS = NUM_FIELDS.map(k => ({ key: k as string, type: 'number' as const }))

async function encSalary(body: Record<string,any>) {
  return encryptFields(body, [...NUM_FIELDS])
}

async function decSalary(row: any) {
  if (!row) return row
  // Decrypt employee name juga kalau ada
  const result = await decryptFields(row, DEC_FIELDS)
  if (result.employee?.full_name?.startsWith('enc:')) {
    const { decryptFields: df } = await import('@/lib/crypto')
    result.employee = await df(result.employee, [{ key: 'full_name', type: 'string' }])
  }
  return result
}

export async function GET(req: NextRequest) {
  const db   = createServiceClient()
  const year = req.nextUrl.searchParams.get('year')
  const month= req.nextUrl.searchParams.get('month')
  let q = db.from('salary_records')
    .select('*, employee:employees(full_name,division)')
    .order('year', { ascending: false })
    .order('month', { ascending: false })
  if (year)  q = q.eq('year',  parseInt(year))
  if (month) q = q.eq('month', parseInt(month))
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const decrypted = await Promise.all((data ?? []).map(decSalary))
  return NextResponse.json({ data: decrypted })
}

export async function POST(req: NextRequest) {
  const db   = createServiceClient()
  const body = await req.json()
  const encrypted = await encSalary(body)
  const { data, error } = await db.from('salary_records').insert(encrypted).select('*, employee:employees(full_name,division)').maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: await decSalary(data) })
}

export async function PATCH(req: NextRequest) {
  const db = createServiceClient()
  const { id, ...body } = await req.json()
  const encrypted = await encSalary(body)
  const { data, error } = await db.from('salary_records').update(encrypted).eq('id', id).select('*, employee:employees(full_name,division)').maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: await decSalary(data) })
}

export async function DELETE(req: NextRequest) {
  const db = createServiceClient()
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await db.from('salary_records').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
