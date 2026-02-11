/**
 * Patient Records Timeline Component
 *
 * Full implementation of the medical records timeline for patient detail page.
 * Displays records in reverse chronological order with expandable cards,
 * edit/delete functionality, and PDF downloads.
 *
 * Created: 2026-02-10 - MV2-018 Patient Detail Page
 * Updated: 2026-02-10 - MV2-033 Full implementation with timeline components
 */

'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  RecordTimeline,
  RecordTimelineSkeleton,
} from '@/components/medical-records/record-timeline'
import { MedicalRecordForm } from '@/components/medical-records/medical-record-form'
import type { MedicalRecord } from '@/types/app'

interface PatientRecordsTimelineProps {
  records: MedicalRecord[]
  patientId: string
  patientName: string
  className?: string
  onRecordCreated?: (record: MedicalRecord) => void
  onRecordUpdated?: (record: MedicalRecord) => void
  onRecordDeleted?: (recordId: string) => void
}

export function PatientRecordsTimeline({
  records,
  patientId,
  patientName,
  className,
  onRecordCreated,
  onRecordUpdated,
  onRecordDeleted,
}: PatientRecordsTimelineProps) {
  const [showAll, setShowAll] = useState(false)
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const hasRecords = records.length > 0

  const handleEdit = useCallback((record: MedicalRecord) => {
    setEditingRecord(record)
  }, [])

  const handleCloseEdit = useCallback(() => {
    setEditingRecord(null)
  }, [])

  const handleCloseCreate = useCallback(() => {
    setShowCreateModal(false)
  }, [])

  const handleShowMore = useCallback(() => {
    setShowAll(true)
  }, [])

  const handleCreateNew = useCallback(() => {
    setShowCreateModal(true)
  }, [])

  const handleCreated = useCallback(
    (record: MedicalRecord) => {
      onRecordCreated?.(record)
      setShowCreateModal(false)
    },
    [onRecordCreated]
  )

  const handleUpdated = useCallback(
    (record: MedicalRecord) => {
      onRecordUpdated?.(record)
      setEditingRecord(null)
    },
    [onRecordUpdated]
  )

  const handleDeleted = useCallback(
    (recordId: string) => {
      onRecordDeleted?.(recordId)
    },
    [onRecordDeleted]
  )

  return (
    <>
      <div
        className={cn(
          'overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3 md:px-5 md:py-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/15 to-emerald-400/10 shadow-sm"
          >
            <ClipboardList className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </motion.div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground md:text-base">
              Historial medico
            </h2>
            <p className="text-xs text-muted-foreground">
              {hasRecords
                ? `${records.length} registro${records.length !== 1 ? 's' : ''}`
                : 'Sin registros aun'}
            </p>
          </div>
          {hasRecords && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateNew}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo</span>
            </Button>
          )}
        </div>

        {/* Timeline Content */}
        <div className="p-4 md:p-5">
          <RecordTimeline
            records={records}
            showAll={showAll}
            maxVisible={5}
            onEdit={handleEdit}
            onDeleted={handleDeleted}
            onShowMore={handleShowMore}
            onCreateNew={handleCreateNew}
          />
        </div>
      </div>

      {/* Edit Modal */}
      {editingRecord && (
        <MedicalRecordForm
          open={!!editingRecord}
          onClose={handleCloseEdit}
          mode="edit"
          existingRecord={editingRecord}
          patientId={patientId}
          patientName={patientName}
          onUpdated={handleUpdated}
        />
      )}

      {/* Create Modal */}
      <MedicalRecordForm
        open={showCreateModal}
        onClose={handleCloseCreate}
        mode="create"
        patientId={patientId}
        patientName={patientName}
        onCreated={handleCreated}
      />
    </>
  )
}

export function PatientRecordsTimelineSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3 md:px-5 md:py-4">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="p-4 md:p-5">
        <RecordTimelineSkeleton />
      </div>
    </div>
  )
}
