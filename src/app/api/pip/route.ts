import { decryptMany } from '@/lib/crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

async function decryptNested(rows: any[]) {
  const DEC = [{ key: 'full_name', type: 'string' as const }]
  return Promise.all((rows ?? []).map(async (r: any) => ({
    ...r,
    employee: r.employee ? (await decryptMany([r.employee], DEC))[0] : r.employee
  })))
}

export async function GET() {
  const db = createServiceClient()
  const { data, error } = await db.from('pip_sp').select('*, employee:employees(full_name,division)').order('issue_date',{ascending:false})
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const decrypted = await decryptNested(data ?? [])
  return NextResponse.json({ data: decrypted })
}
export async function POST(req: NextRequest) {
  const db = createServiceClient()
  const body = await req.json()
  const { data, error } = await db.from('pip_sp').insert(body).select('*, employee:employees(full_name,division)').maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const decrypted = await decryptNested(data ?? [])
  return NextResponse.json({ data: decrypted })
}
export async function PATCH(req: NextRequest) {
  const db = createServiceClient()
  const { id, ...body } = await req.json()
  const { data, error } = await db.from('pip_sp').update(body).eq('id',id).select('*, employee:employees(full_name,division)').maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const decrypted = await decryptNested(data ?? [])
  return NextResponse.json({ data: decrypted })
}
export async function DELETE(req: NextRequest) {
  const db = createServiceClient()
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await db.from('pip_sp').delete().eq('id',id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
