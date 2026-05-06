import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const session = cookies().get('hc_session')?.value
  if (session !== process.env.DASHBOARD_PASSWORD) redirect('/login')
  return (
    <div className="flex min-h-screen bg-navy-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 ml-[210px]">{children}</div>
    </div>
  )
}
