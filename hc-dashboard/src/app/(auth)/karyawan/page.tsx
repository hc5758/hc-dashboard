import { createClient } from '@/lib/supabase/server'
import Topbar from '@/components/layout/Topbar'
import KaryawanTable from '@/components/forms/KaryawanTable'

export default async function KaryawanPage() {
  const supabase = createClient()
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .order('full_name')

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar title="Data Karyawan" addLabel="Tambah karyawan" />
      <div className="flex-1 overflow-y-auto p-5">
        <KaryawanTable employees={employees || []} />
      </div>
    </div>
  )
}
