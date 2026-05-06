import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import TNATable from '@/components/forms/TNATable'

export default async function TNAPage() {
  const supabase = createClient()
  const [{ data: tna }, { data: employees }] = await Promise.all([
    supabase.from('tna_records').select('*, employee:employees(full_name, division, position)').order('created_at', { ascending: false }),
    supabase.from('employees').select('id, full_name, division').eq('status', 'active').order('full_name'),
  ])
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="TNA Tracker" addLabel="Input TNA" />
      <div className="flex-1 overflow-y-auto p-5">
        <TNATable records={tna || []} employees={employees || []} />
      </div>
    </div>
  )
}
