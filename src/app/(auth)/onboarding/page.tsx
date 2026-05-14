import { createServiceClient } from '@/lib/supabase/server'
import { decryptMany } from '@/lib/crypto'
import Topbar from '@/components/layout/Topbar'
import OnboardingPageClient from './OnboardingPageClient'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OnboardingPage() {
  const db = createServiceClient()

  // Karyawan aktif yang join dalam 6 bulan terakhir (masa probation max)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const [{ data: employees }, { data: onboarding }] = await Promise.all([
    db.from('employees')
      .select('id,full_name,position,division,entity,employment_type,join_date,status')
      .eq('status', 'active')
      .gte('join_date', sixMonthsAgo.toISOString().slice(0,10))
      .order('join_date', { ascending: false }),
    db.from('onboarding')
      .select('*')
      .order('created_at', { ascending: false }),
  ])

  const DEC = [{ key: 'full_name', type: 'string' as const }]
  const decEmployees = await decryptMany(employees ?? [], DEC)

  // Merge: untuk tiap karyawan, cari record onboarding-nya
  // Kalau belum ada, buat default kosong
  const merged = decEmployees.map(emp => {
    const rec = (onboarding ?? []).find((o:any) => o.employee_id === emp.id)
    return { employee: emp, onboarding: rec || null }
  })

  return (
    <div className="page-wrapper">
      <Topbar title="Onboarding" subtitle="Tracker probation karyawan baru"/>
      <div className="page-content">
        <OnboardingPageClient merged={merged}/>
      </div>
    </div>
  )
}
