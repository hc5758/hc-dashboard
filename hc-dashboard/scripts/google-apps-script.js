/**
 * ============================================================
 * HC DASHBOARD 5758 — Google Apps Script
 * Sync 2 arah: Google Sheets <-> Supabase Database
 *
 * CARA PASANG:
 * 1. Buka Google Sheet kamu
 * 2. Extensions > Apps Script
 * 3. Copy-paste seluruh script ini
 * 4. Isi SUPABASE_URL dan SUPABASE_KEY di bawah
 * 5. Klik Save, lalu Run > setupTriggers
 * 6. Izinkan akses saat diminta
 * ============================================================
 */

// ─── KONFIGURASI ─────────────────────────────────────────────
const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co'
const SUPABASE_KEY = 'YOUR-ANON-KEY' // dari Supabase > Settings > API

// Sheet name -> nama tabel di Supabase
const SHEET_TABLE_MAP = {
  'Karyawan':     'employees',
  'Onboarding':   'onboarding',
  'Offboarding':  'offboarding',
  'TNA':          'tna_records',
  'Recruitment':  'recruitment',
}

// Kolom header di Sheet -> kolom di database
const COLUMN_MAP = {
  employees: {
    'Employee ID':        'employee_id',
    'Nama Lengkap':       'full_name',
    'Email':              'email',
    'No HP':              'phone',
    'Posisi':             'position',
    'Level':              'level',
    'Divisi':             'division',
    'Entitas':            'entity',
    'Tipe Kontrak':       'employment_type',
    'Lokasi Kerja':       'work_location',
    'Status':             'status',
    'Gender':             'gender',
    'Tgl Lahir':          'birth_date',
    'Status Nikah':       'marital_status',
    'Tgl Bergabung':      'join_date',
    'Tgl Berakhir':       'end_date',
  },
  tna_records: {
    'Employee ID':        'employee_id',
    'Nama Training':      'training_name',
    'Kategori':           'training_category',
    'Metode':             'training_method',
    'Quarter':            'quarter',
    'Tahun':              'year',
    'Target Tanggal':     'target_date',
    'Status':             'status',
    'Skor':               'score',
    'Catatan':            'notes',
  },
}

// ─── TRIGGER SETUP ───────────────────────────────────────────
function setupTriggers() {
  // Hapus trigger lama
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t))

  // Auto sync setiap kali sheet diedit
  ScriptApp.newTrigger('onSheetEdit')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create()

  // Pull data dari Supabase setiap 10 menit
  ScriptApp.newTrigger('pullFromSupabase')
    .timeBased()
    .everyMinutes(10)
    .create()

  SpreadsheetApp.getActive().toast('Trigger berhasil dipasang! Sync aktif.', '5758 HC Sync', 3)
}

// ─── PUSH: Sheet -> Supabase ──────────────────────────────────
function onSheetEdit(e) {
  const sheet = e.source.getActiveSheet()
  const sheetName = sheet.getName()
  const tableName = SHEET_TABLE_MAP[sheetName]
  if (!tableName) return

  // Hindari spam: tunggu 2 detik setelah edit berhenti
  Utilities.sleep(500)
  pushSheetToSupabase(sheetName, tableName)
}

function pushSheetToSupabase(sheetName, tableName) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName)
  if (!sheet) return

  const data = sheet.getDataRange().getValues()
  if (data.length < 2) return

  const headers = data[0]
  const colMap = COLUMN_MAP[tableName] || {}
  const rows = []

  for (let i = 1; i < data.length; i++) {
    const row = data[i]
    if (!row[0]) continue // skip baris kosong

    const obj = {}
    headers.forEach((header, j) => {
      const dbCol = colMap[header]
      if (dbCol && row[j] !== '' && row[j] !== null) {
        let val = row[j]
        // Format tanggal
        if (val instanceof Date) {
          val = Utilities.formatDate(val, 'UTC', 'yyyy-MM-dd')
        }
        obj[dbCol] = val
      }
    })

    if (Object.keys(obj).length > 0) rows.push(obj)
  }

  if (rows.length === 0) return

  // Upsert ke Supabase
  const payload = JSON.stringify(rows)
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'resolution=merge-duplicates',
    },
    payload: payload,
    muteHttpExceptions: true,
  }

  const url = `${SUPABASE_URL}/rest/v1/${tableName}`
  const response = UrlFetchApp.fetch(url, options)
  const code = response.getResponseCode()

  if (code === 200 || code === 201) {
    Logger.log(`✓ Push ${rows.length} baris ke ${tableName}`)
    // Tandai timestamp di sheet
    const ss = SpreadsheetApp.getActive()
    ss.toast(`✓ ${rows.length} baris tersinkron ke database`, 'Sync berhasil', 2)
  } else {
    Logger.log(`✗ Error push ke ${tableName}: ${response.getContentText()}`)
  }
}

// ─── PULL: Supabase -> Sheet ──────────────────────────────────
function pullFromSupabase() {
  Object.entries(SHEET_TABLE_MAP).forEach(([sheetName, tableName]) => {
    pullTableToSheet(tableName, sheetName)
  })
}

function pullTableToSheet(tableName, sheetName) {
  const url = `${SUPABASE_URL}/rest/v1/${tableName}?select=*&order=created_at.desc&limit=500`
  const options = {
    method: 'get',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
    muteHttpExceptions: true,
  }

  const response = UrlFetchApp.fetch(url, options)
  if (response.getResponseCode() !== 200) return

  const rows = JSON.parse(response.getContentText())
  if (!rows || rows.length === 0) return

  const ss = SpreadsheetApp.getActive()
  let sheet = ss.getSheetByName(sheetName)

  // Buat sheet baru jika belum ada
  if (!sheet) {
    sheet = ss.insertSheet(sheetName)
  }

  // Ambil kolom map terbalik
  const colMap = COLUMN_MAP[tableName] || {}
  const reverseMap = Object.fromEntries(Object.entries(colMap).map(([k, v]) => [v, k]))

  // Tentukan header dari data
  const allKeys = [...new Set(rows.flatMap(r => Object.keys(r)))]
  const headers = allKeys.map(k => reverseMap[k] || k)

  // Clear dan tulis ulang
  sheet.clearContents()

  // Header row dengan style
  const headerRange = sheet.getRange(1, 1, 1, headers.length)
  headerRange.setValues([headers])
  headerRange.setBackground('#0f1e3d')
  headerRange.setFontColor('#ffffff')
  headerRange.setFontWeight('bold')
  headerRange.setFontSize(10)

  // Data rows
  const dataRows = rows.map(row =>
    allKeys.map(k => {
      const val = row[k]
      if (val === null || val === undefined) return ''
      if (typeof val === 'object') return JSON.stringify(val)
      return val
    })
  )

  if (dataRows.length > 0) {
    sheet.getRange(2, 1, dataRows.length, allKeys.length).setValues(dataRows)
  }

  // Auto-resize kolom
  sheet.autoResizeColumns(1, headers.length)

  Logger.log(`✓ Pull ${rows.length} baris dari ${tableName} ke sheet ${sheetName}`)
}

// ─── MANUAL SYNC MENU ────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🔄 HC Sync')
    .addItem('Push semua ke database', 'pushAll')
    .addItem('Pull semua dari database', 'pullFromSupabase')
    .addSeparator()
    .addItem('Push sheet ini saja', 'pushCurrentSheet')
    .addItem('Setup auto-trigger', 'setupTriggers')
    .addToUi()
}

function pushAll() {
  Object.entries(SHEET_TABLE_MAP).forEach(([sheetName, tableName]) => {
    pushSheetToSupabase(sheetName, tableName)
  })
  SpreadsheetApp.getActive().toast('Semua sheet berhasil di-push ke database!', '5758 HC Sync', 3)
}

function pushCurrentSheet() {
  const sheet = SpreadsheetApp.getActive().getActiveSheet()
  const tableName = SHEET_TABLE_MAP[sheet.getName()]
  if (!tableName) {
    SpreadsheetApp.getUi().alert('Sheet ini tidak terhubung ke database. Pastikan nama sheet sesuai: ' + Object.keys(SHEET_TABLE_MAP).join(', '))
    return
  }
  pushSheetToSupabase(sheet.getName(), tableName)
}
