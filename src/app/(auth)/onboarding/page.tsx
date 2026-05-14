import { createServiceClient } from '@/lib/supabase/server'
import { decryptMany } from '@/lib/crypto'
import Topbar from '@/components/layout/Topbar'
import OnboardingPageClient from './OnboardingPageClient'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OnboardingPage() {
  const db = createServiceClient()

  // Tampilkan semua karyawan aktif yang:
  // 1. Punya record onboarding (berarti sudah pernah dichecklist), ATAU
  // 2. Join dalam 1 bulan terakhir (baru masuk, otomatis masuk onboarding)
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  const [{ data: allEmployees }, { data: onboarding }] = await Promise.all([
    db.from('employees')
      .select('id,full_name,position,division,entity,employment_type,join_date,status')
      .eq('status', 'active')
      .order('join_date', { ascending: false }),
    db.from('onboarding')
      .select('*')
      .order('created_at', { ascending: false }),
  ])

  const DEC = [{ key: 'full_name', type: 'string' as const }]
  const decEmployees = await decryptMany(allEmployees ?? [], DEC)

  // Filter: punya onboarding record ATAU join dalam 1 bulan terakhir
  const onboardingIds = new Set((onboarding ?? []).map((o:any) => o.employee_id))
  const employees = decEmployees.filter(emp =>
    onboardingIds.has(emp.id) ||
    new Date(emp.join_date + 'T00:00:00') >= oneMonthAgo
  )

  const merged = employees.map(emp => {
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
