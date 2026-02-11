/**
 * Settings Page
 *
 * Main settings route with tabbed interface for organization settings,
 * team management, custom fields, and billing. Role-based tab visibility
 * ensures admins see all options while other roles see limited tabs.
 *
 * Created: 2026-02-10 - MV2-040 Settings Page with Tabs
 * Updated: 2026-02-10 - QA-009 Unified page layout with consistent padding/max-width
 */

import { SettingsTabs } from '@/components/settings/settings-tabs'

export const metadata = {
  title: 'Configuración | MidiMed',
  description: 'Configura tu clínica, equipo y preferencias',
}

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <SettingsTabs />
    </div>
  )
}
