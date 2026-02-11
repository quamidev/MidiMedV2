/**
 * File Upload Zone Component
 *
 * Elegant drag-and-drop file upload zone with progress indicators.
 * Features smooth animations, file type icons, and batch upload support.
 * Designed for medical file management with a clean, clinical aesthetic.
 *
 * Created: 2026-02-10 - MV2-020 Patient file upload
 */

'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  File,
  FileImage,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  CloudUpload,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { uploadPatientFiles } from '@/actions/patients'
import type { PatientFile } from '@/types/app'

// =============================================================================
// Types
// =============================================================================

interface FileWithProgress {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'complete' | 'error'
  error?: string
}

interface FileUploadZoneProps {
  patientId: string
  onUploadComplete?: (files: PatientFile[]) => void
  className?: string
  maxFiles?: number
  maxSizePerFile?: number // in MB
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

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

// =============================================================================
// Component
// =============================================================================

export function FileUploadZone({
  patientId,
  onUploadComplete,
  className,
  maxFiles = 10,
  maxSizePerFile = 10, // 10MB default
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [files, setFiles] = useState<FileWithProgress[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Handle file selection
  const handleFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles || newFiles.length === 0) return

      const maxSizeBytes = maxSizePerFile * 1024 * 1024
      const validFiles: FileWithProgress[] = []
      const errors: string[] = []

      // Check total file count
      const totalFiles = files.length + newFiles.length
      if (totalFiles > maxFiles) {
        toast.error(`Maximo ${maxFiles} archivos permitidos`)
        return
      }

      Array.from(newFiles).forEach((file) => {
        if (file.size > maxSizeBytes) {
          errors.push(`"${file.name}" excede ${maxSizePerFile}MB`)
        } else {
          validFiles.push({
            id: generateId(),
            file,
            progress: 0,
            status: 'pending',
          })
        }
      })

      if (errors.length > 0) {
        errors.forEach((err) => toast.error(err))
      }

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles])
      }
    },
    [files.length, maxFiles, maxSizePerFile]
  )

  // Drag handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  // Remove file from queue
  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }, [])

  // Upload files
  const uploadFiles = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending')
    if (pendingFiles.length === 0) return

    setIsUploading(true)

    // Mark all as uploading with simulated progress
    setFiles((prev) =>
      prev.map((f) =>
        f.status === 'pending' ? { ...f, status: 'uploading' as const } : f
      )
    )

    // Simulate progress animation
    const progressInterval = setInterval(() => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.status === 'uploading' && f.progress < 90) {
            return { ...f, progress: Math.min(f.progress + Math.random() * 15, 90) }
          }
          return f
        })
      )
    }, 200)

    try {
      const formData = new FormData()
      pendingFiles.forEach((f) => {
        formData.append('files', f.file)
      })

      const result = await uploadPatientFiles(patientId, formData)

      clearInterval(progressInterval)

      if (result.success) {
        // Mark all as complete
        setFiles((prev) =>
          prev.map((f) =>
            f.status === 'uploading'
              ? { ...f, status: 'complete' as const, progress: 100 }
              : f
          )
        )

        toast.success(
          `${result.data.length} ${result.data.length === 1 ? 'archivo subido' : 'archivos subidos'} correctamente`
        )

        // Notify parent and clear after delay
        onUploadComplete?.(result.data)

        setTimeout(() => {
          setFiles((prev) => prev.filter((f) => f.status !== 'complete'))
        }, 2000)
      } else {
        // Mark all as error
        setFiles((prev) =>
          prev.map((f) =>
            f.status === 'uploading'
              ? { ...f, status: 'error' as const, error: result.error }
              : f
          )
        )
        toast.error(result.error)
      }
    } catch {
      clearInterval(progressInterval)
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'uploading'
            ? { ...f, status: 'error' as const, error: 'Error de conexion' }
            : f
        )
      )
      toast.error('Error al subir los archivos')
    } finally {
      setIsUploading(false)
    }
  }, [files, patientId, onUploadComplete])

  // Clear all files
  const clearAll = useCallback(() => {
    setFiles([])
  }, [])

  const pendingCount = files.filter((f) => f.status === 'pending').length

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        animate={{
          scale: isDragOver ? 1.01 : 1,
          borderColor: isDragOver ? 'var(--primary)' : 'var(--border)',
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          'relative overflow-hidden rounded-xl border-2 border-dashed cursor-pointer transition-all duration-300',
          'bg-gradient-to-b from-muted/30 to-muted/10',
          'hover:border-primary/50 hover:bg-muted/20',
          isDragOver && 'border-primary bg-primary/5'
        )}
      >
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="upload-grid"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="1" cy="1" r="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#upload-grid)" />
          </svg>
        </div>

        <div className="relative px-6 py-10 md:py-14 flex flex-col items-center text-center">
          <motion.div
            animate={{
              y: isDragOver ? -5 : 0,
              scale: isDragOver ? 1.1 : 1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-300',
              isDragOver
                ? 'bg-primary/15 text-primary'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {isDragOver ? (
              <CloudUpload className="w-8 h-8" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </motion.div>

          <AnimatePresence mode="wait">
            {isDragOver ? (
              <motion.div
                key="drop"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <p className="text-lg font-medium text-primary">
                  Suelta los archivos aqui
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <p className="text-base font-medium text-foreground mb-1">
                  Arrastra archivos aqui o haz clic para seleccionar
                </p>
                <p className="text-sm text-muted-foreground">
                  Maximo {maxSizePerFile}MB por archivo, hasta {maxFiles} archivos
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </motion.div>

      {/* File Queue */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-1">
              <span className="text-sm text-muted-foreground">
                {files.length} {files.length === 1 ? 'archivo' : 'archivos'} en cola
              </span>
              {!isUploading && (
                <button
                  onClick={clearAll}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Limpiar todo
                </button>
              )}
            </div>

            {/* File List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {files.map((fileItem) => {
                  const Icon = getFileIcon(fileItem.file.name)
                  return (
                    <motion.div
                      key={fileItem.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, scale: 0.9 }}
                      className={cn(
                        'relative flex items-center gap-3 p-3 rounded-lg border bg-card',
                        fileItem.status === 'complete' && 'border-primary/30 bg-primary/5',
                        fileItem.status === 'error' && 'border-destructive/30 bg-destructive/5'
                      )}
                    >
                      {/* File Icon */}
                      <div
                        className={cn(
                          'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                          fileItem.status === 'complete'
                            ? 'bg-primary/15 text-primary'
                            : fileItem.status === 'error'
                              ? 'bg-destructive/15 text-destructive'
                              : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {fileItem.status === 'complete' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : fileItem.status === 'error' ? (
                          <AlertCircle className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-foreground">
                          {fileItem.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fileItem.status === 'error'
                            ? fileItem.error
                            : formatFileSize(fileItem.file.size)}
                        </p>
                      </div>

                      {/* Progress or Remove */}
                      {fileItem.status === 'uploading' ? (
                        <div className="w-12 text-right">
                          <span className="text-xs font-medium text-primary">
                            {Math.round(fileItem.progress)}%
                          </span>
                        </div>
                      ) : fileItem.status === 'pending' ? (
                        <button
                          onClick={() => removeFile(fileItem.id)}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      ) : null}

                      {/* Progress Bar */}
                      {fileItem.status === 'uploading' && (
                        <motion.div
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary/20 rounded-b-lg overflow-hidden"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <motion.div
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: `${fileItem.progress}%` }}
                            transition={{ duration: 0.2 }}
                          />
                        </motion.div>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Upload Button */}
            {pendingCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-2"
              >
                <Button
                  onClick={uploadFiles}
                  disabled={isUploading}
                  isLoading={isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    'Subiendo archivos...'
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Subir {pendingCount} {pendingCount === 1 ? 'archivo' : 'archivos'}
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
