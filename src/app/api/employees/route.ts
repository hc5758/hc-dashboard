import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { encryptFields, decryptFields, decryptMany } from '@/lib/crypto'

// Hanya full_name yang dienkripsi — birth_date tetap plain (tipe date di DB)
const ENC_KEYS   = ['full_name'] as const
const DEC_FIELDS = [{ key: 'full_name', type: 'string' as const }]

export async function GET(req: NextRequest) {
  const db = createServiceClient()
  const id = req.nextUrl.searchParams.get('id')
  let q = db.from('employees').select('*').order('created_at', { ascending: false })
  if (id) q = (q as any).eq('id', id)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const decrypted = await decryptMany(data ?? [], DEC_FIELDS)
  return NextResponse.json({ data: decrypted })
}

export async function POST(req: NextRequest) {
  const db   = createServiceClient()
  const body = await req.json()
  const encrypted = await encryptFields(body, [...ENC_KEYS])
  const { data, error } = await db.from('employees').insert(encrypted).select().maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const decrypted = data ? await decryptFields(data, DEC_FIELDS) : data
  return NextResponse.json({ data: decrypted })
}

export async function PATCH(req: NextRequest) {
  const db = createServiceClient()
  const { id, updated_at, ...body } = await req.json()
  const fieldsToEncrypt = ENC_KEYS.filter(k => body[k] !== undefined && body[k] !== null && body[k] !== '')
  const encrypted = fieldsToEncrypt.length > 0 ? await encryptFields(body, fieldsToEncrypt) : body
  const { data, error } = await db.from('employees').update(encrypted).eq('id', id).select().maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const decrypted = data ? await decryptFields(data, DEC_FIELDS) : data
  return NextResponse.json({ data: decrypted })
}

export async function DELETE(req: NextRequest) {
  const db = createServiceClient()
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await db.from('employees').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
