/**
 * Patient Detail Page
 *
 * Comprehensive patient profile page displaying demographics, AI summary,
 * appointments, medical records, and files. Responsive layout with mobile-first
 * design and two-column layout on desktop.
 *
 * Created: 2026-02-10 - MV2-018 Patient Detail Page
 * Updated: 2026-02-10 - MV2-033/034 Timeline and AI summary integration
 * Updated: 2026-02-10 - QA-009 Unified page layout with consistent padding/max-width
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { useUser } from '@/contexts/user-context'
import { Button } from '@/components/ui/button'
import { getPatientById, getPatientFiles } from '@/actions/patients'
import {
  PatientHeader,
  PatientHeaderSkeleton,
} from '@/components/patients/patient-header'
import {
  PatientAiSummary,
  PatientAiSummarySkeleton,
} from '@/components/patients/patient-ai-summary'
import {
  PatientAppointments,
  PatientAppointmentsSkeleton,
} from '@/components/patients/patient-appointments'
import {
  PatientRecordsTimeline,
  PatientRecordsTimelineSkeleton,
} from '@/components/patients/patient-records-timeline'
import {
  PatientFiles,
  PatientFilesSkeleton,
} from '@/components/patients/patient-files'
import type { PatientWithRelations, PatientFile, MedicalRecord } from '@/types/app'

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useUser()

  const patientId = params.id as string

  const [patient, setPatient] = useState<PatientWithRelations | null>(null)
  const [files, setFiles] = useState<PatientFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedRef = useRef(false)

  const loadPatient = useCallback(async () => {
    if (!patientId) return

    try {
      const result = await getPatientById(patientId)
      if (result.success) {
        setPatient(result.data)
        setError(null)
      } else {
        setError(result.error)
        toast.error(result.error)
      }
    } catch (err) {
      console.error('Error loading patient:', err)
      setError('Error al cargar el paciente')
      toast.error('Error al cargar el paciente')
    }
  }, [patientId])

  const loadFiles = useCallback(async () => {
    if (!patientId) return

    try {
      const result = await getPatientFiles(patientId)
      if (result.success) {
        setFiles(result.data)
      }
    } catch (err) {
      console.error('Error loading files:', err)
    }
  }, [patientId])

  const loadData = useCallback(async () => {
    setLoading(true)
    await Promise.all([loadPatient(), loadFiles()])
    setLoading(false)
  }, [loadPatient, loadFiles])

  // Initial data load when user is authenticated
  useEffect(() => {
    if (!authLoading && user && patientId && !hasLoadedRef.current) {
      hasLoadedRef.current = true
      // Use startTransition or schedule loading for next tick to avoid setState in effect
      const timeoutId = setTimeout(() => {
        loadData()
      }, 0)
      return () => clearTimeout(timeoutId)
    }
  }, [authLoading, user, patientId, loadData])

  const handleEditClick = useCallback(() => {
    toast.info('Edición de paciente disponible próximamente')
  }, [])

  const handlePhotoUpdated = useCallback((newUrl: string) => {
    setPatient((prev) => (prev ? { ...prev, photo_url: newUrl } : null))
  }, [])

  const handleFilesChanged = useCallback(() => {
    loadFiles()
  }, [loadFiles])

  const handleBack = useCallback(() => {
    router.push('/patients')
  }, [router])

  // Medical record callbacks
  const handleRecordCreated = useCallback((record: MedicalRecord) => {
    setPatient((prev) => {
      if (!prev) return null
      return {
        ...prev,
        medical_records: [record, ...prev.medical_records],
      }
    })
  }, [])

  const handleRecordUpdated = useCallback((updatedRecord: MedicalRecord) => {
    setPatient((prev) => {
      if (!prev) return null
      return {
        ...prev,
        medical_records: prev.medical_records.map((r) =>
          r.id === updatedRecord.id ? updatedRecord : r
        ),
      }
    })
  }, [])

  const handleRecordDeleted = useCallback((recordId: string) => {
    setPatient((prev) => {
      if (!prev) return null
      return {
        ...prev,
        medical_records: prev.medical_records.filter((r) => r.id !== recordId),
      }
    })
  }, [])

  // AI Summary callback
  const handleSummaryUpdated = useCallback((summary: string) => {
    setPatient((prev) => {
      if (!prev) return null
      return { ...prev, summary }
    })
  }, [])

  // Computed values
  const patientName = patient
    ? `${patient.first_name} ${patient.last_name}`.trim()
    : ''
  const hasRecords = patient ? patient.medical_records.length > 0 : false

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-6xl">
        {/* Back button */}
        <div className="mb-4 md:mb-6">
          <Button variant="ghost" size="sm" disabled>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a pacientes
          </Button>
        </div>

        {/* Mobile skeleton layout */}
        <div className="space-y-4 md:hidden">
          <PatientHeaderSkeleton />
          <PatientAiSummarySkeleton />
          <PatientAppointmentsSkeleton />
          <PatientRecordsTimelineSkeleton />
          <PatientFilesSkeleton />
        </div>

        {/* Desktop skeleton layout */}
        <div className="hidden md:block">
          <PatientHeaderSkeleton />
          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              <PatientAiSummarySkeleton />
              <PatientAppointmentsSkeleton />
            </div>
            <div className="space-y-6 lg:col-span-2">
              <PatientRecordsTimelineSkeleton />
              <PatientFilesSkeleton />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !patient) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 md:mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a pacientes
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <Loader2 className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            {error || 'Paciente no encontrado'}
          </h2>
          <p className="mb-6 text-muted-foreground">
            No pudimos cargar la información del paciente.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBack}>
              Volver
            </Button>
            <Button onClick={loadData}>Reintentar</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Back button */}
      <div className="mb-4 md:mb-6">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a pacientes
        </Button>
      </div>

      {/* Mobile Layout - Single column */}
      <div className="space-y-4 md:hidden">
        <PatientHeader
          patient={patient}
          onEditClick={handleEditClick}
          onPhotoUpdated={handlePhotoUpdated}
        />
        <PatientAiSummary
          patientId={patient.id}
          initialSummary={patient.summary}
          summaryUpdatedAt={patient.updated_at}
          hasRecords={hasRecords}
          onSummaryUpdated={handleSummaryUpdated}
        />
        <PatientAppointments appointments={patient.appointments} />
        <PatientRecordsTimeline
          records={patient.medical_records}
          patientId={patient.id}
          patientName={patientName}
          onRecordCreated={handleRecordCreated}
          onRecordUpdated={handleRecordUpdated}
          onRecordDeleted={handleRecordDeleted}
        />
        <PatientFiles
          patientId={patient.id}
          files={files}
          onFilesChanged={handleFilesChanged}
        />
      </div>

      {/* Desktop Layout - Two columns */}
      <div className="hidden md:block">
        <PatientHeader
          patient={patient}
          onEditClick={handleEditClick}
          onPhotoUpdated={handlePhotoUpdated}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          {/* Left column - Main content */}
          <div className="space-y-6 lg:col-span-3">
            <PatientAiSummary
              patientId={patient.id}
              initialSummary={patient.summary}
              summaryUpdatedAt={patient.updated_at}
              hasRecords={hasRecords}
              onSummaryUpdated={handleSummaryUpdated}
            />
            <PatientAppointments appointments={patient.appointments} />
          </div>

          {/* Right column - Sidebar content */}
          <div className="space-y-6 lg:col-span-2">
            <PatientRecordsTimeline
              records={patient.medical_records}
              patientId={patient.id}
              patientName={patientName}
              onRecordCreated={handleRecordCreated}
              onRecordUpdated={handleRecordUpdated}
              onRecordDeleted={handleRecordDeleted}
            />
            <PatientFiles
              patientId={patient.id}
              files={files}
              onFilesChanged={handleFilesChanged}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
