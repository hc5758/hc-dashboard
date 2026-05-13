import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { secret } = await req.json()
  if (secret !== process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceClient()
  const { data: employees, error } = await db.from('employees').select('id, full_name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ALG = 'AES-GCM'
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) return NextResponse.json({ error: 'ENCRYPTION_KEY tidak ada' }, { status: 500 })

  const keyBytes = new TextEncoder().encode(raw.padEnd(32, '0').slice(0, 32))
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: ALG }, false, ['encrypt', 'decrypt'])

  function bufToB64(buf: ArrayBuffer | Uint8Array): string {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
    let bin = ''; bytes.forEach(b => { bin += String.fromCharCode(b) }); return btoa(bin)
  }

  async function encryptName(plain: string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const data = new TextEncoder().encode(plain)
    const cipher = await crypto.subtle.encrypt({ name: ALG, iv }, key, data)
    const combined = new Uint8Array(12 + cipher.byteLength)
    combined.set(iv, 0); combined.set(new Uint8Array(cipher), 12)
    return 'enc:' + bufToB64(combined)
  }

  async function tryDecrypt(cipher: string): Promise<string | null> {
    try {
      const b64 = cipher.slice(4)
      const bin = atob(b64); const buf = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
      const iv = buf.slice(0, 12); const data = buf.slice(12)
      const plain = await crypto.subtle.decrypt({ name: ALG, iv }, key, data)
      return new TextDecoder().decode(plain)
    } catch { return null }
  }

  let fixed = 0, skipped = 0, already = 0

  for (const emp of employees ?? []) {
    const name = emp.full_name
    if (!name) { skipped++; continue }

    if (name.startsWith('enc:')) {
      const decrypted = await tryDecrypt(name)
      if (decrypted) { already++; continue }
      // Tidak bisa di-decrypt — data corrupt/key beda, skip
      skipped++; continue
    }

    // Plain text — enkripsi dengan key sekarang
    const encrypted = await encryptName(name)
    const { error: updErr } = await db.from('employees').update({ full_name: encrypted }).eq('id', emp.id)
    if (updErr) skipped++; else fixed++
  }

  return NextResponse.json({ ok: true, fixed, already, skipped,
    message: `${fixed} dienkripsi ulang, ${already} sudah benar, ${skipped} tidak bisa dipulihkan`
  })
}
