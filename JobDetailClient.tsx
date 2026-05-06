import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const ALLOWED = ['employees', 'recruitment', 'onboarding', 'offboarding', 'tna_records']

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.GOOGLE_SHEETS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { table, rows, action = 'upsert' } = await req.json()
  if (!table || !ALLOWED.includes(table)) return NextResponse.json({ error: 'Table not allowed' }, { status: 400 })
  if (!Array.isArray(rows) || rows.length === 0) return NextResponse.json({ error: 'No rows' }, { status: 400 })

  const db = createServiceClient()
  const conflict = table === 'employees' ? 'employee_id' : 'id'
  const { data, error } = action === 'upsert'
    ? await db.from(table).upsert(rows, { onConflict: conflict }).select()
    : await db.from(table).insert(rows).select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, synced: data?.length ?? rows.length })
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.GOOGLE_SHEETS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const table = req.nextUrl.searchParams.get('table') ?? 'employees'
  if (!ALLOWED.includes(table)) return NextResponse.json({ error: 'Table not allowed' }, { status: 400 })

  const db = createServiceClient()
  const { data, error } = await db.from(table).select('*').order('created_at', { ascending: false }).limit(1000)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, count: data?.length ?? 0 })
}
