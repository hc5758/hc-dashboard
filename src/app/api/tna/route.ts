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
  const { data, error } = await db.from('tna_records').select('*, employee:employees(full_name,division)').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const decrypted = await decryptNested(data ?? [])
  return NextResponse.json({ data: decrypted })
}

export async function POST(req: NextRequest) {
  const db = createServiceClient()
  const body = await req.json()
  const { data, error } = await db.from('tna_records').insert(body)
    .select('*, employee:employees(full_name,division)').maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const [dec] = data ? await decryptNested([data]) : [data]
  return NextResponse.json({ data: dec })
}

export async function PATCH(req: NextRequest) {
  const db = createServiceClient()
  const queryId = req.nextUrl.searchParams.get('id')
  const body = await req.json()
  const { id: bodyId, ...update } = body
  const id = queryId || bodyId
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { data, error } = await db.from('tna_records').update(update).eq('id', id).select().maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const [dec] = data ? await decryptNested([data]) : [data]
  return NextResponse.json({ data: dec })
}

export async function DELETE(req: NextRequest) {
  const db = createServiceClient()
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await db.from('tna_records').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
