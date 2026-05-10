/**
 * AES-256-GCM encryption untuk data sensitif
 * Dienkripsi SEBELUM masuk Supabase — Supabase hanya menyimpan ciphertext
 */

const ALG = 'AES-GCM'

async function getKey(): Promise<CryptoKey> {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) throw new Error('ENCRYPTION_KEY tidak ditemukan di environment')
  const keyBytes = new TextEncoder().encode(raw.padEnd(32, '0').slice(0, 32))
  return crypto.subtle.importKey('raw', keyBytes, { name: ALG }, false, ['encrypt', 'decrypt'])
}

function bufToB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let bin = ''
  bytes.forEach(b => { bin += String.fromCharCode(b) })
  return btoa(bin)
}

function b64ToBuf(b64: string): Uint8Array {
  const bin = atob(b64)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf
}

export async function encrypt(plain: string): Promise<string> {
  if (plain === null || plain === undefined || plain === '') return plain
  const key    = await getKey()
  const iv     = crypto.getRandomValues(new Uint8Array(12))
  const data   = new TextEncoder().encode(String(plain))
  const cipher = await crypto.subtle.encrypt({ name: ALG, iv }, key, data)

  const combined = new Uint8Array(12 + cipher.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(cipher), 12)
  return 'enc:' + bufToB64(combined)
}

export async function decrypt(cipher: string): Promise<string> {
  if (!cipher || !String(cipher).startsWith('enc:')) return cipher
  try {
    const key  = await getKey()
    const buf  = b64ToBuf(String(cipher).slice(4))
    const iv   = buf.slice(0, 12)
    const data = buf.slice(12)
    const plain = await crypto.subtle.decrypt({ name: ALG, iv }, key, data)
    return new TextDecoder().decode(plain)
  } catch {
    return cipher
  }
}

export async function encryptNum(n: number): Promise<string> {
  return encrypt(String(n))
}

export async function decryptNum(s: string): Promise<number> {
  if (!s) return 0
  if (!String(s).startsWith('enc:')) return parseFloat(String(s)) || 0
  const plain = await decrypt(String(s))
  return parseFloat(plain) || 0
}

// Encrypt fields dalam object
export async function encryptFields(obj: Record<string,any>, fields: readonly string[]): Promise<Record<string,any>> {
  const result = { ...obj }
  for (const field of fields) {
    const val = obj[field]
    if (val !== null && val !== undefined && val !== '') {
      result[field] = typeof val === 'number' ? await encryptNum(val) : await encrypt(String(val))
    }
  }
  return result
}

// Decrypt fields dalam object
export async function decryptFields(obj: Record<string,any>, fields: { key: string; type: 'string'|'number' }[]): Promise<Record<string,any>> {
  if (!obj) return obj
  const result = { ...obj }
  for (const { key, type } of fields) {
    const val = obj[key]
    if (val && String(val).startsWith('enc:')) {
      result[key] = type === 'number' ? await decryptNum(String(val)) : await decrypt(String(val))
    }
  }
  return result
}

// Decrypt array
export async function decryptMany(arr: Record<string,any>[], fields: { key: string; type: 'string'|'number' }[]): Promise<Record<string,any>[]> {
  return Promise.all(arr.map(obj => decryptFields(obj, fields)))
}
