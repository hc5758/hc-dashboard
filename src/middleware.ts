import { NextRequest, NextResponse } from 'next/server'

const PUBLIC = ['/login', '/api/sync', '/api/auth', '/_next', '/favicon']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next()
  const session = req.cookies.get('hc_session')?.value
  if (!session || session !== process.env.DASHBOARD_PASSWORD) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
