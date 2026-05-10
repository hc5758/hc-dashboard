import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { encryptFields, decryptFields, decryptMany } from '@/lib/crypto'

// Field yang dienkripsi di tabel employees
const ENC_FIELDS = [{ key: 'full_name' as const, type: 'string' as const }]
const ENC_KEYS   = ['full_name'] as const

export async function GET(req: NextRequest) {
  const db  = createServiceClient()
  const id  = req.nextUrl.searchParams.get('id')
  let q = db.from('employees').select('*').order('created_at', { ascending: false })
  if (id) q = (q as any).eq('id', id)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Decrypt full_name untuk semua rows
  const decrypted = await decryptMany(data ?? [], ENC_FIELDS)
  return NextResponse.json({ data: decrypted })
}

export async function POST(req: NextRequest) {
  const db   = createServiceClient()
  const body = await req.json()
  // Encrypt sebelum simpan
  const encrypted = await encryptFields(body, [...ENC_KEYS])
  const { data, error } = await db.from('employees').insert(encrypted).select().maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Decrypt untuk response
  const decrypted = data ? await decryptFields(data, ENC_FIELDS) : data
  return NextResponse.json({ data: decrypted })
}

export async function PATCH(req: NextRequest) {
  const db = createServiceClient()
  const { id, updated_at, ...body } = await req.json()
  // Encrypt field yang berubah
  const encrypted = await encryptFields(body, body.full_name ? [...ENC_KEYS] : [])
  const { data, error } = await db.from('employees').update(encrypted).eq('id', id).select().maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const decrypted = data ? await decryptFields(data, ENC_FIELDS) : data
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
