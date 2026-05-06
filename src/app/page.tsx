import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default function RootPage() {
  const session = cookies().get('hc_session')?.value
  if (session === process.env.DASHBOARD_PASSWORD) {
    redirect('/dashboard')
  }
  redirect('/login')
}
