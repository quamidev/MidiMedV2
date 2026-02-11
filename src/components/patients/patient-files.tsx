/**
 * Patient Files Component
 *
 * File management section with upload, download, and delete capabilities.
 * Features drag-and-drop upload and a clean file list with actions.
 *
 * Created: 2026-02-10 - MV2-018 Patient Detail Page
 */

'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  FolderOpen,
  Upload,
  FileText,
  Image,
  FileArchive,
  File,
  Download,
  Trash2,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { uploadPatientFiles, deletePatientFile } from '@/actions/patients'
import type { PatientFile } from '@/types/app'

interface PatientFilesProps {
  patientId: string
  files: PatientFile[]
  onFilesChanged?: () => void
  className?: string
}

type FileType = 'image' | 'document' | 'archive' | 'generic'

function getFileType(filename: string): FileType {
  const ext = filename.split('.').pop()?.toLowerCase() || ''

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
    return 'image'
  }
  if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)) {
    return 'document'
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return 'archive'
  }
  return 'generic'
}

function FileIcon({ type, className }: { type: FileType; className?: string }) {
  switch (type) {
    case 'image':
      return <Image className={className} />
    case 'document':
      return <FileText className={className} />
    case 'archive':
      return <FileArchive className={className} />
    default:
      return <File className={className} />
  }
}

function FileCard({
  file,
  onDelete,
  isDeleting,
}: {
  file: PatientFile
  onDelete: () => void
  isDeleting: boolean
}) {
  const fileType = useMemo(() => getFileType(file.name), [file.name])
  const uploadedDate = parseISO(file.uploaded_at)

  return (
    <div className="group flex items-center gap-3 rounded-xl border border-border/50 bg-card p-3 transition-all hover:border-border hover:shadow-sm md:p-4">
      {/* File icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted md:h-12 md:w-12">
        <FileIcon type={fileType} className="h-5 w-5 text-muted-foreground md:h-6 md:w-6" />
      </div>

      {/* File info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {format(uploadedDate, "d MMM yyyy, HH:mm", { locale: es })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          download={file.name}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
            'text-muted-foreground hover:bg-muted hover:text-foreground',
            'opacity-0 group-hover:opacity-100 md:opacity-100'
          )}
          title="Descargar"
        >
          <Download className="h-4 w-4" />
        </a>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
            'text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
            'opacity-0 group-hover:opacity-100 md:opacity-100',
            'disabled:opacity-50'
          )}
          title="Eliminar"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  )
}

export function PatientFiles({
  patientId,
  files,
  onFilesChanged,
  className,
}: PatientFilesProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(
    async (selectedFiles: FileList | null) => {
      if (!selectedFiles || selectedFiles.length === 0) return

      setIsUploading(true)
      try {
        const formData = new FormData()
        Array.from(selectedFiles).forEach((file) => {
          formData.append('files', file)
        })

        const result = await uploadPatientFiles(patientId, formData)
        if (result.success) {
          toast.success(
            `${result.data.length} archivo${result.data.length !== 1 ? 's' : ''} subido${result.data.length !== 1 ? 's' : ''}`
          )
          onFilesChanged?.()
        } else {
          toast.error(result.error)
        }
      } catch (error) {
        console.error('Error uploading files:', error)
        toast.error('Error al subir los archivos')
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    [patientId, onFilesChanged]
  )

  const handleDelete = useCallback(
    async (fileId: string) => {
      setDeletingFileId(fileId)
      try {
        const result = await deletePatientFile(fileId)
        if (result.success) {
          toast.success('Archivo eliminado')
          onFilesChanged?.()
        } else {
          toast.error(result.error)
        }
      } catch (error) {
        console.error('Error deleting file:', error)
        toast.error('Error al eliminar el archivo')
      } finally {
        setDeletingFileId(null)
      }
    },
    [onFilesChanged]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleUpload(e.dataTransfer.files)
    },
    [handleUpload]
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleUpload(e.target.files)
    },
    [handleUpload]
  )

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3 md:px-5 md:py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/10 shadow-sm">
          <FolderOpen className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-foreground md:text-base">
            Archivos del paciente
          </h2>
          <p className="text-xs text-muted-foreground">
            {files.length === 0
              ? 'Sin archivos'
              : `${files.length} archivo${files.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUploadClick}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-1.5 h-4 w-4" />
          )}
          Subir
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 md:p-5">
        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative mb-4 rounded-xl border-2 border-dashed p-6 text-center transition-all',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border/50 hover:border-border',
            isUploading && 'pointer-events-none opacity-50'
          )}
        >
          {isDragging ? (
            <div className="flex flex-col items-center">
              <Upload className="mb-2 h-8 w-8 text-primary" />
              <p className="text-sm font-medium text-primary">
                Suelta los archivos aquí
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="mb-1 text-sm font-medium text-foreground">
                Arrastra archivos aquí
              </p>
              <p className="text-xs text-muted-foreground">
                o haz clic en el botón &quot;Subir&quot;
              </p>
              <p className="mt-2 text-xs text-muted-foreground/70">
                Máximo 10MB por archivo
              </p>
            </div>
          )}
        </div>

        {/* File list */}
        {files.length > 0 ? (
          <div className="space-y-2">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onDelete={() => handleDelete(file.id)}
                isDeleting={deletingFileId === file.id}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <p className="text-sm text-muted-foreground">
              Los archivos subidos aparecerán aquí
            </p>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  )
}

export function PatientFilesSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3 md:px-5 md:py-4">
        <div className="h-9 w-9 animate-pulse rounded-xl bg-muted" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-36 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-9 w-20 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="p-4 md:p-5">
        <div className="mb-4 h-32 animate-pulse rounded-xl bg-muted/50" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border/50 p-3 md:p-4"
            >
              <div className="h-10 w-10 animate-pulse rounded-lg bg-muted md:h-12 md:w-12" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                <div className="h-3 w-28 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
