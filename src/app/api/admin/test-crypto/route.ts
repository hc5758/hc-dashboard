import { NextResponse } from 'next/server'
import { encrypt, decrypt } from '@/lib/crypto'

export async function GET() {
  const key = process.env.ENCRYPTION_KEY
  const testName = 'Nama Test Karyawan'
  
  try {
    const encrypted = await encrypt(testName)
    const decrypted = await decrypt(encrypted)
    
    return NextResponse.json({
      key_exists: !!key,
      key_length: key?.length ?? 0,
      key_preview: key ? key.slice(0,4) + '...' + key.slice(-4) : null,
      test_name: testName,
      encrypted,
      decrypted,
      roundtrip_ok: decrypted === testName
    })
  } catch(e: any) {
    return NextResponse.json({ error: e.message, key_exists: !!key }, { status: 500 })
  }
}
