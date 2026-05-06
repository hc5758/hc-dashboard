import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // Verify secret
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.GOOGLE_SHEETS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { table, rows, action = 'upsert' } = body

  if (!table || !rows || !Array.isArray(rows)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Allowed tables
  const ALLOWED = ['employees', 'onboarding', 'offboarding', 'tna_records', 'recruitment']
  if (!ALLOWED.includes(table)) {
    return NextResponse.json({ error: 'Table not allowed' }, { status: 400 })
  }

  try {
    let result
    if (action === 'upsert') {
      const conflictCol = table === 'employees' ? 'employee_id' : 'id'
      result = await supabase.from(table)
        .upsert(rows, { onConflict: conflictCol })
    } else if (action === 'insert') {
      result = await supabase.from(table).insert(rows)
    }

    if (result?.error) throw result.error

    // Log activity
    await supabase.from('activity_log').insert({
      action: `sync_from_sheets`,
      table_name: table,
      description: `Google Sheets sync: ${rows.length} baris di-${action}`,
    })

    return NextResponse.json({
      success: true,
      message: `${rows.length} baris berhasil di-sync ke ${table}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET: fetch data for Sheets to pull
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.GOOGLE_SHEETS_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const table = req.nextUrl.searchParams.get('table') || 'employees'
  const ALLOWED = ['employees', 'onboarding', 'offboarding', 'tna_records', 'recruitment']
  if (!ALLOWED.includes(table)) {
    return NextResponse.json({ error: 'Table not allowed' }, { status: 400 })
  }

  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(1000)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, count: data?.length || 0 })
}
