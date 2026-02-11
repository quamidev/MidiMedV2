/**
 * File List Component
 *
 * Displays patient files with download and delete functionality.
 * Features elegant animations, file type detection, and confirmation dialogs.
 * Designed for medical file management with a clean, professional aesthetic.
 *
 * Created: 2026-02-10 - MV2-020 Patient file upload
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  File,
  FileImage,
  FileText,
  Download,
  Trash2,
  FolderOpen,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getPatientFiles, deletePatientFile } from '@/actions/patients'
import type { PatientFile } from '@/types/app'

// =============================================================================
// Types
// =============================================================================

interface FileListProps {
  patientId: string
  files?: PatientFile[]
  onFilesChange?: (files: PatientFile[]) => void
  className?: string
}

interface DeleteConfirmModalProps {
  file: PatientFile
  isOpen: boolean
  isDeleting: boolean
  onClose: () => void
  onConfirm: () => void
}

// =============================================================================
// Helper Functions
// =============================================================================

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
  const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt']

  if (ext && imageExts.includes(ext)) {
    return FileImage
  }
  if (ext && docExts.includes(ext)) {
    return FileText
  }
  return File
}

function getFileColor(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
  const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt']

  if (ext && imageExts.includes(ext)) {
    return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
  }
  if (ext && docExts.includes(ext)) {
    return 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
  }
  return 'bg-muted text-muted-foreground'
}

function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), "d 'de' MMM, yyyy", { locale: es })
  } catch {
    return dateString
  }
}

// =============================================================================
// Delete Confirmation Modal
// =============================================================================

function DeleteConfirmModal({
  file,
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, isDeleting, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isDeleting ? undefined : onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md"
          >
            <div className="relative bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
              {/* Decorative top accent */}
              <div className="h-1 bg-gradient-to-r from-destructive/60 via-destructive to-destructive/60" />

              {/* Close button */}
              {!isDeleting && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <div className="p-6">
                {/* Icon */}
                <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-7 h-7 text-destructive" />
                </div>

                {/* Content */}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Eliminar archivo
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Esta acción no se puede deshacer. El archivo sera eliminado permanentemente.
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-sm">
                    <File className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium truncate max-w-[200px]">
                      {file.name}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={onClose}
                    disabled={isDeleting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={onConfirm}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// =============================================================================
// File List Component
// =============================================================================

export function FileList({
  patientId,
  files: initialFiles,
  onFilesChange,
  className,
}: FileListProps) {
  const [files, setFiles] = useState<PatientFile[]>(initialFiles || [])
  const [isLoading, setIsLoading] = useState(!initialFiles)
  const [deleteModal, setDeleteModal] = useState<{
    file: PatientFile
    isDeleting: boolean
  } | null>(null)

  // Fetch files if not provided
  useEffect(() => {
    if (initialFiles) {
      setFiles(initialFiles)
      return
    }

    const fetchFiles = async () => {
      setIsLoading(true)
      try {
        const result = await getPatientFiles(patientId)
        if (result.success) {
          setFiles(result.data)
        } else {
          toast.error(result.error)
        }
      } catch {
        toast.error('Error al cargar archivos')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFiles()
  }, [patientId, initialFiles])

  // Sync with parent when files change
  useEffect(() => {
    onFilesChange?.(files)
  }, [files, onFilesChange])

  // Handle download
  const handleDownload = useCallback((file: PatientFile) => {
    // Open the signed URL in a new tab for download
    window.open(file.url, '_blank')
  }, [])

  // Handle delete
  const openDeleteModal = useCallback((file: PatientFile) => {
    setDeleteModal({ file, isDeleting: false })
  }, [])

  const closeDeleteModal = useCallback(() => {
    setDeleteModal(null)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deleteModal) return

    setDeleteModal((prev) => (prev ? { ...prev, isDeleting: true } : null))

    try {
      const result = await deletePatientFile(deleteModal.file.id)

      if (result.success) {
        setFiles((prev) => prev.filter((f) => f.id !== deleteModal.file.id))
        toast.success('Archivo eliminado')
        closeDeleteModal()
      } else {
        toast.error(result.error)
        setDeleteModal((prev) => (prev ? { ...prev, isDeleting: false } : null))
      }
    } catch {
      toast.error('Error al eliminar el archivo')
      setDeleteModal((prev) => (prev ? { ...prev, isDeleting: false } : null))
    }
  }, [deleteModal, closeDeleteModal])

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card animate-pulse"
          >
            <div className="w-10 h-10 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Empty state
  if (files.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex flex-col items-center justify-center py-12 px-6 rounded-xl border-2 border-dashed bg-muted/20',
          className
        )}
      >
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <FolderOpen className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-base font-medium text-foreground mb-1">
          Sin archivos
        </p>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Los archivos subidos para este paciente aparecerán aquí
        </p>
      </motion.div>
    )
  }

  return (
    <>
      <div className={cn('space-y-2', className)}>
        <AnimatePresence mode="popLayout">
          {files.map((file, index) => {
            const Icon = getFileIcon(file.name)
            const colorClass = getFileColor(file.name)

            return (
              <motion.div
                key={file.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="group relative flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors duration-200"
              >
                {/* File Icon */}
                <div
                  className={cn(
                    'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105',
                    colorClass
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-foreground group-hover:text-primary transition-colors">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(file.uploaded_at)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDownload(file)}
                    title="Descargar"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => openDeleteModal(file)}
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Mobile touch-friendly actions */}
                <div className="flex items-center gap-1 md:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDownload(file)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => openDeleteModal(file)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <DeleteConfirmModal
          file={deleteModal.file}
          isOpen={true}
          isDeleting={deleteModal.isDeleting}
          onClose={closeDeleteModal}
          onConfirm={confirmDelete}
        />
      )}
    </>
  )
}

// =============================================================================
// Export Refresh Helper
// =============================================================================

/**
 * Helper to refresh the file list from a parent component.
 * Use this when files are uploaded via FileUploadZone.
 */
export function useFileListRefresh(patientId: string) {
  const [files, setFiles] = useState<PatientFile[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getPatientFiles(patientId)
      if (result.success) {
        setFiles(result.data)
      }
    } catch {
      // Silent fail, toast already shown by action
    } finally {
      setIsLoading(false)
    }
  }, [patientId])

  // Initial load
  useEffect(() => {
    refresh()
  }, [refresh])

  return { files, isLoading, refresh, setFiles }
}
