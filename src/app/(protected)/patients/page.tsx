/**
 * Patients Page
 *
 * Main entry point for patient management. Displays the patient list
 * with search, pagination, and navigation to patient details.
 *
 * Created: 2026-02-10 - MV2-016 Patient list page
 */

'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'

import { PatientList } from '@/components/patients/patient-list'

export default function PatientsPage() {
  // Placeholder for create modal - will be implemented in MV2-017
  const [, setCreateModalOpen] = useState(false)

  const handleCreatePatient = useCallback(() => {
    // TODO: MV2-017 will implement the create patient modal
    setCreateModalOpen(true)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-4 md:p-6 pb-24 md:pb-6 max-w-6xl mx-auto"
    >
      <PatientList onCreatePatient={handleCreatePatient} />
    </motion.div>
  )
}
