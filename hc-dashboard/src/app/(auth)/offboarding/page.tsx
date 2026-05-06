import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import OffboardingTable from '@/components/forms/OffboardingTable'

export default async function OffboardingPage() {
  const supabase = createClient()
  const [{ data: offboarding }, { data: employees }] = await Promise.all([
    supabase.from('offboarding').select('*, employee:employees(*), pic:admin_users(full_name)').order('report_date', { ascending: false }),
    supabase.from('employees').select('id, full_name, division, employment_type').eq('status', 'active').order('full_name'),
  ])
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="Offboarding & Resign" addLabel="Tambah data keluar" />
      <div className="flex-1 overflow-y-auto p-5">
        <OffboardingTable records={offboarding || []} employees={employees || []} />
      </div>
    </div>
  )
}
