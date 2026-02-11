/**
 * Custom Fields Settings Component
 *
 * Admin-only configuration for custom medical record fields.
 * Supports text, number, boolean, date, and select field types
 * with auto-generated camelCase keys from labels.
 *
 * Created: 2026-02-10 - MV2-043 Custom Fields Configuration
 */

'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Type,
  Hash,
  ToggleLeft,
  Calendar,
  List,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useUser } from '@/hooks/use-user'
import { updateExtraFields } from '@/actions/settings'
import type { CustomField } from '@/types/app'
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
import { CustomFieldEditor } from './custom-field-editor'

// =============================================================================
// Field Type Config
// =============================================================================

type FieldType = CustomField['type']

const FIELD_TYPE_CONFIG: Record<
  FieldType,
  { label: string; icon: React.ElementType; color: string }
> = {
  text: {
    label: 'Texto',
    icon: Type,
    color: 'text-blue-500 bg-blue-500/10',
  },
  number: {
    label: 'Numero',
    icon: Hash,
    color: 'text-emerald-500 bg-emerald-500/10',
  },
  boolean: {
    label: 'Si/No',
    icon: ToggleLeft,
    color: 'text-purple-500 bg-purple-500/10',
  },
  date: {
    label: 'Fecha',
    icon: Calendar,
    color: 'text-amber-500 bg-amber-500/10',
  },
  select: {
    label: 'Opciones',
    icon: List,
    color: 'text-pink-500 bg-pink-500/10',
  },
}

// =============================================================================
// Component
// =============================================================================

export function CustomFieldsSettings() {
  const { tenant, refreshUser } = useUser()
  const [fields, setFields] = useState<CustomField[]>(
    () => tenant?.extra_fields || []
  )
  const [saving, setSaving] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingField, setEditingField] = useState<CustomField | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fieldToDelete, setFieldToDelete] = useState<CustomField | null>(null)

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleSave = useCallback(
    async (updatedFields: CustomField[]) => {
      setSaving(true)
      try {
        const result = await updateExtraFields(updatedFields)

        if (result.success) {
          toast.success('Campos actualizados')
          setFields(updatedFields)
          await refreshUser()
        } else {
          toast.error(result.error)
        }
      } catch (error) {
        console.error('Save fields error:', error)
        toast.error('Error al guardar campos')
      } finally {
        setSaving(false)
      }
    },
    [refreshUser]
  )

  const handleAddField = useCallback(() => {
    setEditingField(null)
    setEditorOpen(true)
  }, [])

  const handleEditField = useCallback((field: CustomField) => {
    setEditingField(field)
    setEditorOpen(true)
  }, [])

  const handleDeleteClick = useCallback((field: CustomField) => {
    setFieldToDelete(field)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!fieldToDelete) return

    const updatedFields = fields.filter((f) => f.id !== fieldToDelete.id)
    await handleSave(updatedFields)
    setDeleteDialogOpen(false)
    setFieldToDelete(null)
  }, [fieldToDelete, fields, handleSave])

  const handleFieldSaved = useCallback(
    async (field: CustomField) => {
      let updatedFields: CustomField[]

      if (editingField) {
        // Update existing
        updatedFields = fields.map((f) => (f.id === field.id ? field : f))
      } else {
        // Add new
        updatedFields = [...fields, field]
      }

      await handleSave(updatedFields)
      setEditorOpen(false)
      setEditingField(null)
    },
    [editingField, fields, handleSave]
  )

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <div className="border-b border-border bg-muted/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">
                  Campos personalizados
                </h2>
                <p className="text-xs text-muted-foreground">
                  {fields.length} campo{fields.length !== 1 ? 's' : ''} configurado
                  {fields.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button size="sm" onClick={handleAddField}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Agregar campo</span>
              <span className="sm:hidden">Agregar</span>
            </Button>
          </div>
        </div>

        <div className="p-6">
          {fields.length === 0 ? (
            <EmptyState onAdd={handleAddField} />
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {fields.map((field, index) => {
                  const config = FIELD_TYPE_CONFIG[field.type]
                  const Icon = config.icon

                  return (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className="group flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50 hover:border-border transition-colors"
                    >
                      {/* Drag Handle (visual only for now) */}
                      <div className="hidden sm:flex text-muted-foreground/50 cursor-grab">
                        <GripVertical className="h-4 w-4" />
                      </div>

                      {/* Field Type Icon */}
                      <div
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-lg shrink-0',
                          config.color
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Field Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-foreground truncate">
                            {field.name}
                          </p>
                          {field.required && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-destructive/10 text-destructive">
                              Requerido
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {config.label} &middot;{' '}
                          <code className="text-[10px] bg-muted px-1 rounded">
                            {field.id}
                          </code>
                        </p>
                        {field.type === 'select' && field.options && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            Opciones: {field.options.join(', ')}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditField(field)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(field)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>

      {/* Field Preview */}
      {fields.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-2xl border border-border bg-card overflow-hidden"
        >
          <div className="border-b border-border bg-muted/30 px-6 py-4">
            <h3 className="font-semibold text-foreground">
              Vista previa en expediente medico
            </h3>
            <p className="text-xs text-muted-foreground">
              Asi se veran los campos en el formulario de expediente
            </p>
          </div>
          <div className="p-6">
            <FieldPreview fields={fields} />
          </div>
        </motion.div>
      )}

      {/* Field Editor Modal */}
      <CustomFieldEditor
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false)
          setEditingField(null)
        }}
        onSave={handleFieldSaved}
        existingField={editingField}
        existingIds={fields.map((f) => f.id)}
        saving={saving}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar campo</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro de eliminar el campo &quot;{fieldToDelete?.name}&quot;? Esta
              accion no se puede deshacer. Los datos existentes en expedientes
              no seran afectados, pero el campo ya no aparecera en nuevos
              formularios.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// =============================================================================
// Empty State
// =============================================================================

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <FileText className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="mt-4 font-medium text-foreground">
        Sin campos personalizados
      </h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
        Agrega campos personalizados para capturar informacion especifica de tu
        clinica en los expedientes medicos.
      </p>
      <Button className="mt-4" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-2" />
        Agregar primer campo
      </Button>
    </div>
  )
}

// =============================================================================
// Field Preview
// =============================================================================

function FieldPreview({ fields }: { fields: CustomField[] }) {
  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border space-y-4">
      {fields.map((field) => {
        return (
          <div key={field.id} className="space-y-1.5">
            <label className="text-sm font-medium text-foreground flex items-center gap-1">
              {field.name}
              {field.required && <span className="text-destructive">*</span>}
            </label>

            {field.type === 'text' && (
              <div className="h-10 rounded-lg border border-input bg-background px-3 flex items-center text-sm text-muted-foreground">
                Texto libre...
              </div>
            )}

            {field.type === 'number' && (
              <div className="h-10 w-32 rounded-lg border border-input bg-background px-3 flex items-center text-sm text-muted-foreground">
                0
              </div>
            )}

            {field.type === 'boolean' && (
              <div className="flex items-center gap-2">
                <div className="h-6 w-11 rounded-full bg-input" />
                <span className="text-sm text-muted-foreground">No</span>
              </div>
            )}

            {field.type === 'date' && (
              <div className="h-10 w-48 rounded-lg border border-input bg-background px-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Seleccionar fecha
              </div>
            )}

            {field.type === 'select' && (
              <div className="h-10 rounded-lg border border-input bg-background px-3 flex items-center justify-between text-sm text-muted-foreground">
                <span>Seleccionar opcion</span>
                <List className="h-4 w-4" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
