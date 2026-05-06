import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HC Dashboard — 5758 Creative Lab',
  description: 'Internal HR Analytics Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
