/**
 * Photo Upload Component
 *
 * Reusable component for patient photo management with drag-and-drop support,
 * preview functionality, and delete confirmation. Features a refined medical
 * aesthetic with smooth transitions and clear visual feedback.
 *
 * Created: 2026-02-10 - MV2-019 Edit Patient Modal
 */

'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Trash2, X, Check, User, ImagePlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

// =============================================================================
// Types
// =============================================================================

interface PhotoUploadProps {
  currentPhotoUrl?: string | null
  onUpload: (file: File) => Promise<void>
  onDelete?: () => Promise<void>
  isLoading?: boolean
  size?: 'sm' | 'md' | 'lg'
}

// =============================================================================
// Constants
// =============================================================================

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const sizeClasses = {
  sm: 'h-20 w-20',
  md: 'h-28 w-28',
  lg: 'h-36 w-36',
}

// =============================================================================
// Component
// =============================================================================

export function PhotoUpload({
  currentPhotoUrl,
  onUpload,
  onDelete,
  isLoading = false,
  size = 'lg',
}: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isProcessing = isLoading || uploadLoading || deleteLoading

  // Handle file selection validation
  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return 'Tipo de archivo no permitido. Use JPG, PNG, GIF o WebP.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'El archivo es muy grande. Maximo 5MB.'
    }
    return null
  }, [])

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file)
    if (error) {
      // Could integrate with toast here, but keeping component pure
      console.error(error)
      return
    }

    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setPreviewFile(file)
  }, [validateFile])

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isProcessing) {
      setIsDragging(true)
    }
  }, [isProcessing])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (isProcessing) return

    const files = e.dataTransfer.files
    if (files.length > 0 && files[0]) {
      handleFileSelect(files[0])
    }
  }, [isProcessing, handleFileSelect])

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0 && files[0]) {
      handleFileSelect(files[0])
    }
    // Reset input to allow selecting the same file again
    e.target.value = ''
  }, [handleFileSelect])

  // Handle click to open file dialog
  const handleClick = useCallback(() => {
    if (!isProcessing && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [isProcessing])

  // Confirm upload
  const handleConfirmUpload = useCallback(async () => {
    if (!previewFile) return

    setUploadLoading(true)
    try {
      await onUpload(previewFile)
      // Clean up preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(null)
      setPreviewFile(null)
    } catch (error) {
      console.error('Error uploading photo:', error)
    } finally {
      setUploadLoading(false)
    }
  }, [previewFile, previewUrl, onUpload])

  // Cancel preview
  const handleCancelPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setPreviewFile(null)
  }, [previewUrl])

  // Handle delete
  const handleConfirmDelete = useCallback(async () => {
    if (!onDelete) return

    setDeleteLoading(true)
    try {
      await onDelete()
      setShowDeleteDialog(false)
    } catch (error) {
      console.error('Error deleting photo:', error)
    } finally {
      setDeleteLoading(false)
    }
  }, [onDelete])

  // Determine which image to display
  const displayUrl = previewUrl || currentPhotoUrl

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Photo Container */}
      <div className="relative group">
        {/* Main Photo Circle */}
        <motion.div
          className={cn(
            'relative rounded-full overflow-hidden',
            'border-2 border-dashed transition-colors duration-200',
            sizeClasses[size],
            isDragging
              ? 'border-primary bg-primary/5'
              : displayUrl
              ? 'border-transparent'
              : 'border-muted-foreground/30 hover:border-primary/50',
            isProcessing && 'opacity-50 cursor-not-allowed',
            !displayUrl && !isProcessing && 'cursor-pointer'
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={!displayUrl ? handleClick : undefined}
          whileHover={!displayUrl && !isProcessing ? { scale: 1.02 } : {}}
          whileTap={!displayUrl && !isProcessing ? { scale: 0.98 } : {}}
        >
          <AnimatePresence mode="wait">
            {displayUrl ? (
              <motion.img
                key="photo"
                src={displayUrl}
                alt="Foto del paciente"
                className="h-full w-full object-cover"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              />
            ) : (
              <motion.div
                key="placeholder"
                className="h-full w-full flex flex-col items-center justify-center bg-muted/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {isDragging ? (
                  <ImagePlus className="h-8 w-8 text-primary" />
                ) : (
                  <>
                    <User className="h-8 w-8 text-muted-foreground/50" />
                    <span className="text-[10px] text-muted-foreground/50 mt-1">
                      Subir foto
                    </span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading Overlay */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center"
              >
                <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Action Buttons Overlay (when photo exists and no preview) */}
        {displayUrl && !previewUrl && !isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1"
          >
            <motion.button
              type="button"
              onClick={handleClick}
              className={cn(
                'p-1.5 rounded-full bg-background border border-border shadow-md',
                'text-muted-foreground hover:text-primary hover:border-primary',
                'transition-colors duration-200'
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Cambiar foto"
            >
              <Camera className="h-3.5 w-3.5" />
            </motion.button>
            {onDelete && (
              <motion.button
                type="button"
                onClick={() => setShowDeleteDialog(true)}
                className={cn(
                  'p-1.5 rounded-full bg-background border border-border shadow-md',
                  'text-muted-foreground hover:text-destructive hover:border-destructive',
                  'transition-colors duration-200'
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="Eliminar foto"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </motion.button>
            )}
          </motion.div>
        )}
      </div>

      {/* Preview Actions */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-2"
          >
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCancelPreview}
              disabled={uploadLoading}
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmUpload}
              isLoading={uploadLoading}
            >
              {!uploadLoading && <Check className="h-4 w-4 mr-1" />}
              Guardar foto
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        onChange={handleInputChange}
        className="hidden"
        disabled={isProcessing}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar foto</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Esta seguro que desea eliminar la foto del paciente? Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Eliminando...
                </span>
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Drag Hint Text */}
      {!displayUrl && !isProcessing && (
        <p className="text-xs text-muted-foreground text-center">
          Arrastra una imagen o haz clic para seleccionar
        </p>
      )}
    </div>
  )
}
