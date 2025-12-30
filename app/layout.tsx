import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Equipment Borrowing System',
  description: 'Secure Equipment Borrowing & Return Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

