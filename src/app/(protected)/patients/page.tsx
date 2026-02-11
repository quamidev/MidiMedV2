/**
 * Patients Page
 *
 * Main entry point for patient management. Displays the patient list
 * with search, pagination, and navigation to patient details.
 * Includes create patient modal integration.
 *
 * Created: 2026-02-10 - MV2-016 Patient list page
 * Updated: 2026-02-10 - QA-009 Unified page layout with consistent padding/max-width
 * Updated: 2026-02-10 - QA-013 Connected CreatePatientModal to page buttons
 */

'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'

import { PatientList } from '@/components/patients/patient-list'
import { CreatePatientModal } from '@/components/patients/create-patient-modal'

export default function PatientsPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleCreatePatient = useCallback(() => {
    setCreateModalOpen(true)
  }, [])

  const handleModalClose = useCallback(() => {
    setCreateModalOpen(false)
  }, [])

  const handlePatientCreated = useCallback(() => {
    setRefreshKey((prev) => prev + 1)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-6xl"
    >
      <PatientList key={refreshKey} onCreatePatient={handleCreatePatient} />

      <CreatePatientModal
        open={createModalOpen}
        onClose={handleModalClose}
        onCreated={handlePatientCreated}
      />
    </motion.div>
  )
}
