/**
 * Settings Page
 *
 * Main settings route with tabbed interface for organization settings,
 * team management, custom fields, and billing. Role-based tab visibility
 * ensures admins see all options while other roles see limited tabs.
 *
 * Created: 2026-02-10 - MV2-040 Settings Page with Tabs
 */

import { SettingsTabs } from '@/components/settings/settings-tabs'

export const metadata = {
  title: 'Configuracion | MidiMed',
  description: 'Configura tu clinica, equipo y preferencias',
}

export default function SettingsPage() {
  return (
    <main className="min-h-screen p-4 pb-24 md:p-6 md:pb-6">
      <div className="mx-auto max-w-4xl">
        <SettingsTabs />
      </div>
    </main>
  )
}
