/**
 * HC Dashboard 5758 — Google Apps Script
 * Paste this in: Google Sheets → Extensions → Apps Script
 *
 * Setup:
 * 1. Buka Google Sheets yang berisi data karyawan
 * 2. Extensions → Apps Script → paste kode ini
 * 3. Ganti DASHBOARD_URL dan WEBHOOK_SECRET di bawah
 * 4. Save → Run → Authorize
 * 5. (Optional) Set trigger: Triggers → + Add Trigger → onEdit / time-driven
 */

const CONFIG = {
  DASHBOARD_URL: 'https://your-app.vercel.app',  // ← ganti dengan URL Vercel kamu
  WEBHOOK_SECRET: 'your-random-secret-here',       // ← sama dengan env GOOGLE_SHEETS_WEBHOOK_SECRET
}

// ─── PUSH: Kirim data dari Sheets ke Dashboard ─────────────────────────────
function pushEmployees() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Karyawan')
  if (!sheet) { Logger.log('Sheet "Karyawan" tidak ditemukan'); return }

  const data = sheet.getDataRange().getValues()
  const headers = data[0]
  const rows = data.slice(1)
    .filter(row => row[0]) // skip empty rows
    .map(row => {
      const obj = {}
      headers.forEach((h, i) => { if (row[i] !== '') obj[h] = row[i] })
      return obj
    })

  const res = UrlFetchApp.fetch(`${CONFIG.DASHBOARD_URL}/api/sync`, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-webhook-secret': CONFIG.WEBHOOK_SECRET },
    payload: JSON.stringify({ table: 'employees', rows, action: 'upsert' }),
  })

  const result = JSON.parse(res.getContentText())
  SpreadsheetApp.getUi().alert(`✅ Sync berhasil!\n${result.synced} baris diperbarui ke dashboard.`)
}

function pushRecruitment() {
  pushTable('Recruitment', 'recruitment')
}

function pushTNA() {
  pushTable('TNA', 'tna_records')
}

function pushTable(sheetName, tableName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName)
  if (!sheet) { Logger.log(`Sheet "${sheetName}" tidak ditemukan`); return }

  const data = sheet.getDataRange().getValues()
  const headers = data[0]
  const rows = data.slice(1)
    .filter(row => row[0])
    .map(row => {
      const obj = {}
      headers.forEach((h, i) => { if (row[i] !== '') obj[h] = row[i] })
      return obj
    })

  const res = UrlFetchApp.fetch(`${CONFIG.DASHBOARD_URL}/api/sync`, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-webhook-secret': CONFIG.WEBHOOK_SECRET },
    payload: JSON.stringify({ table: tableName, rows, action: 'upsert' }),
  })

  const result = JSON.parse(res.getContentText())
  Logger.log(`Sync ${tableName}: ${result.synced} rows`)
  return result
}

// ─── PULL: Ambil data dari Dashboard ke Sheets ─────────────────────────────
function pullEmployees() {
  pullTable('employees', 'Karyawan (Dashboard)')
}

function pullTable(tableName, sheetName) {
  const url = `${CONFIG.DASHBOARD_URL}/api/sync?table=${tableName}&secret=${CONFIG.WEBHOOK_SECRET}`
  const res = UrlFetchApp.fetch(url)
  const { data } = JSON.parse(res.getContentText())

  if (!data || data.length === 0) { Logger.log('Tidak ada data'); return }

  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName)
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(sheetName)
  }
  sheet.clearContents()

  const headers = Object.keys(data[0])
  sheet.appendRow(headers)
  data.forEach(row => sheet.appendRow(headers.map(h => row[h] ?? '')))

  SpreadsheetApp.getUi().alert(`✅ Pull berhasil!\n${data.length} baris diambil dari dashboard.`)
}

// ─── MENU ──────────────────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🔄 HC Dashboard 5758')
    .addItem('📤 Push Karyawan → Dashboard', 'pushEmployees')
    .addItem('📤 Push Recruitment → Dashboard', 'pushRecruitment')
    .addItem('📤 Push TNA → Dashboard', 'pushTNA')
    .addSeparator()
    .addItem('📥 Pull dari Dashboard → Sheets', 'pullEmployees')
    .addSeparator()
    .addItem('⚙️ Cek koneksi', 'testConnection')
    .addToUi()
}

function testConnection() {
  try {
    const url = `${CONFIG.DASHBOARD_URL}/api/sync?table=employees&secret=${CONFIG.WEBHOOK_SECRET}`
    const res = UrlFetchApp.fetch(url)
    const data = JSON.parse(res.getContentText())
    SpreadsheetApp.getUi().alert(`✅ Koneksi OK!\nDashboard URL: ${CONFIG.DASHBOARD_URL}\nTotal karyawan: ${data.count}`)
  } catch (e) {
    SpreadsheetApp.getUi().alert(`❌ Koneksi gagal!\n${e.message}\n\nCek DASHBOARD_URL dan WEBHOOK_SECRET`)
  }
}

// ─── AUTO TRIGGER (opsional) ───────────────────────────────────────────────
// Untuk setup auto-sync setiap jam:
// Triggers → + Add Trigger → Function: autoSync → Event: Time-driven → Hour timer → Every hour
function autoSync() {
  try {
    pushEmployees()
    Logger.log('Auto-sync karyawan berhasil: ' + new Date())
  } catch (e) {
    Logger.log('Auto-sync error: ' + e.message)
  }
}
