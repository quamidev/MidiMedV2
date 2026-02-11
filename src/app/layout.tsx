/**
 * Root layout for MidiMed v2 application.
 * Sets up fonts, language, and global providers.
 *
 * Created: 2026-02-10 - Initial setup
 */

import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'MidiMed - Sistema de Gestion Medica',
  description:
    'Plataforma de gestion medica para clinicas en Latinoamerica. Administra pacientes, citas y expedientes medicos.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
