import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HC Dashboard — 5758 Creative Lab',
  description: 'Portal Internal Human Capital 5758 Creative Lab',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
