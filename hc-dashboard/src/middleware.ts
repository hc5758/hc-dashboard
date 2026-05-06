import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const { pathname } = req.nextUrl

  // Public routes - skip
  if (pathname.startsWith('/login') || pathname.startsWith('/_next') || pathname.startsWith('/api/sync')) {
    return res
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // 1. Cek apakah user sudah login via Supabase Auth
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 2. Verifikasi bahwa user ada di tabel admin_users dan is_active = true
  const { data: adminUser, error } = await supabase
    .from('admin_users')
    .select('id, role, is_active')
    .eq('id', user.id)
    .single()

  if (error || !adminUser || !adminUser.is_active) {
    // User login tapi bukan admin - paksa logout dan redirect
    await supabase.auth.signOut()
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('error', 'no_access')
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login).*)'],
}
