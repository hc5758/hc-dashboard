import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import OnboardingTableFull from '@/components/forms/OnboardingTableFull'

export default async function OnboardingPage() {
  const supabase = createClient()
  const [{ data: onboarding }, { data: employees }, { data: admins }] = await Promise.all([
    supabase.from('onboarding').select('*, employee:employees(*), pic:admin_users(full_name)').order('created_at', { ascending: false }),
    supabase.from('employees').select('id, full_name, division, position').order('full_name'),
    supabase.from('admin_users').select('id, full_name').eq('is_active', true),
  ])
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="Onboarding Checklist" addLabel="Tambah karyawan baru" />
      <div className="flex-1 overflow-y-auto p-5">
        <OnboardingTableFull records={onboarding || []} employees={employees || []} admins={admins || []} />
      </div>
    </div>
  )
}
