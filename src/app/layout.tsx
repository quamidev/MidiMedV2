/**
 * Root layout for MidiMed v2 application.
 * Sets up fonts, language, and global providers.
 *
 * Created: 2026-02-10 - Initial setup
 * Updated: 2026-02-10 - QA-012 Added global Toaster for toast notifications
 */

import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { Toaster } from 'sonner'

import './globals.css'

const sourceSansPro = localFont({
  variable: '--font-source-sans-pro',
  src: [
    {
      path: '../../node_modules/@fontsource/source-sans-pro/files/source-sans-pro-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource/source-sans-pro/files/source-sans-pro-latin-600-normal.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource/source-sans-pro/files/source-sans-pro-latin-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
})

export const metadata: Metadata = {
  title: 'MidiMed - Sistema de Gestión Médica',
  description:
    'Plataforma de gestión médica para clínicas. Administra pacientes, citas y expedientes médicos.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${sourceSansPro.variable} antialiased`}
      >
        {children}
        <Toaster
          position="top-right"
          richColors
        />
      </body>
    </html>
  )
}
