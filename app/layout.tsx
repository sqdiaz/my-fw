import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MyFreedomWall',
  description: 'THE space for students/alumni to discuss anything and everything university.',
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
