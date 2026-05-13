import { decryptMany } from '@/lib/crypto'
import { NextResponse } from 'next/server'
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
  const today = new Date()
  const in60 = new Date(today.getTime() + 60*24*60*60*1000).toISOString().slice(0,10)
  const todayStr = today.toISOString().slice(0,10)

  const [{ data: contracts }, { data: tna }, { data: offboarding }, { data: employees }] = await Promise.all([
    db.from('contracts').select('*, employee:employees(full_name,division)').eq('is_active',true).lte('end_date', in60).gte('end_date', todayStr).order('end_date'),
    db.from('tna_records').select('*, employee:employees(full_name,division)').eq('status','Overdue'),
    db.from('offboarding').select('*, employee:employees(division)'),
    db.from('employees').select('status').eq('status','active'),
  ])

  const notifs: any[] = []

  // Kontrak habis <60 hari
  if ((contracts??[]).length > 0) {
    const names = (contracts??[]).slice(0,3).map((c:any)=>c.employee?.full_name?.split(' ')[0]).join(', ')
    const extra = (contracts??[]).length > 3 ? ` +${(contracts??[]).length-3} lainnya` : ''
    notifs.push({ id:'contract', title:`${(contracts??[]).length} kontrak habis <60 hari`, desc:`${names}${extra} perlu keputusan`, time:'Hari ini', color:'bg-red-500', href:'/workforce' })
  }

  // TNA overdue
  if ((tna??[]).length > 0) {
    const names = (tna??[]).slice(0,2).map((t:any)=>t.employee?.full_name?.split(' ')[0]).join(' & ')
    notifs.push({ id:'tna', title:`${(tna??[]).length} TNA overdue`, desc:`${names} belum selesai`, time:'', color:'bg-amber-500', href:'/learning' })
  }

  // Divisi turnover tinggi
  const byDiv: Record<string,number> = {}
  ;(offboarding??[]).filter((o:any)=>new Date(o.effective_date||o.report_date||'').getFullYear()===today.getFullYear()).forEach((o:any)=>{
    const d=o.employee?.division??'Unknown'; byDiv[d]=(byDiv[d]||0)+1
  })
  const activeCount = (employees??[]).length
  const highTurnDiv = Object.entries(byDiv).filter(([,c])=>activeCount>0&&(c/activeCount*100)>10).sort((a,b)=>b[1]-a[1])
  if (highTurnDiv.length > 0) {
    const [div, count] = highTurnDiv[0]
    notifs.push({ id:'turnover', title:`${div}: turnover tinggi`, desc:`${count} karyawan keluar tahun ini — perlu perhatian`, time:'', color:'bg-purple-500', href:'/turnover' })
  }

  return NextResponse.json({ data: notifs })
}
