/**
 * Custom Field Editor Component
 *
 * Modal for creating and editing custom fields with support for
 * all field types. Auto-generates camelCase keys from field labels.
 *
 * Created: 2026-02-10 - MV2-043 Custom Fields Configuration
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Type,
  Hash,
  ToggleLeft,
  Calendar,
  List,
  AlertCircle,
  Plus,
  X,
} from 'lucide-react'

import type { CustomField } from '@/types/app'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// =============================================================================
// Types & Schema
// =============================================================================

type FieldType = CustomField['type']

const fieldSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  type: z.enum(['text', 'number', 'boolean', 'select', 'date']),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
})

type FieldFormData = z.infer<typeof fieldSchema>

interface CustomFieldEditorProps {
  open: boolean
  onClose: () => void
  onSave: (field: CustomField) => void
  existingField: CustomField | null
  existingIds: string[]
  saving: boolean
}

// =============================================================================
// Field Type Options
// =============================================================================

interface FieldTypeOption {
  value: FieldType
  label: string
  description: string
  icon: React.ElementType
}

const FIELD_TYPES: FieldTypeOption[] = [
  {
    value: 'text',
    label: 'Texto',
    description: 'Campo de texto libre',
    icon: Type,
  },
  {
    value: 'number',
    label: 'Número',
    description: 'Valor numérico',
    icon: Hash,
  },
  {
    value: 'boolean',
    label: 'Si/No',
    description: 'Interruptor de verdadero/falso',
    icon: ToggleLeft,
  },
  {
    value: 'date',
    label: 'Fecha',
    description: 'Selector de fecha',
    icon: Calendar,
  },
  {
    value: 'select',
    label: 'Opciones',
    description: 'Lista desplegable',
    icon: List,
  },
]

// =============================================================================
// Helpers
// =============================================================================

/**
 * Converts a string to camelCase, removing accents and special characters.
 */
function toCamelCase(str: string): string {
  // Remove accents
  const normalized = str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace special characters with spaces
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    // Trim and split
    .trim()
    .toLowerCase()
    .split(/\s+/)

  if (normalized.length === 0) return ''

  return normalized
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('')
}

/**
 * Generates a unique ID from a name, checking against existing IDs.
 */
function generateUniqueId(name: string, existingIds: string[]): string {
  let baseId = toCamelCase(name)
  if (!baseId) baseId = 'campo'

  let id = baseId
  let counter = 1

  while (existingIds.includes(id)) {
    id = `${baseId}${counter}`
    counter++
  }

  return id
}

// =============================================================================
// Component
// =============================================================================

export function CustomFieldEditor({
  open,
  onClose,
  onSave,
  existingField,
  existingIds,
  saving,
}: CustomFieldEditorProps) {
  const [selectOptions, setSelectOptions] = useState<string[]>(
    existingField?.options || []
  )
  const [newOption, setNewOption] = useState('')
  const [generatedId, setGeneratedId] = useState(existingField?.id || '')

  const isEditing = !!existingField

  const form = useForm<FieldFormData>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      name: existingField?.name || '',
      type: existingField?.type || 'text',
      required: existingField?.required || false,
      options: existingField?.options || [],
    },
  })

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = form

  const fieldType = watch('type')
  const fieldName = watch('name')

  // Update generated ID when name changes
  useEffect(() => {
    if (!isEditing && fieldName) {
      setGeneratedId(generateUniqueId(fieldName, existingIds))
    }
  }, [fieldName, existingIds, isEditing])

  // Reset form when opening
  useEffect(() => {
    if (open) {
      reset({
        name: existingField?.name || '',
        type: existingField?.type || 'text',
        required: existingField?.required || false,
        options: existingField?.options || [],
      })
      setSelectOptions(existingField?.options || [])
      setGeneratedId(existingField?.id || '')
    }
  }, [open, existingField, reset])

  // ==========================================================================
  // Handlers
  // ==========================================================================

  const handleAddOption = useCallback(() => {
    const trimmed = newOption.trim()
    if (trimmed && !selectOptions.includes(trimmed)) {
      setSelectOptions((prev) => [...prev, trimmed])
      setNewOption('')
    }
  }, [newOption, selectOptions])

  const handleRemoveOption = useCallback((option: string) => {
    setSelectOptions((prev) => prev.filter((o) => o !== option))
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleAddOption()
      }
    },
    [handleAddOption]
  )

  const onSubmit = useCallback(
    (data: FieldFormData) => {
      const field: CustomField = {
        id: isEditing ? existingField!.id : generatedId,
        name: data.name,
        type: data.type,
        required: data.required,
        ...(data.type === 'select' && { options: selectOptions }),
      }

      onSave(field)
    },
    [isEditing, existingField, generatedId, selectOptions, onSave]
  )

  const handleClose = useCallback(() => {
    reset()
    setSelectOptions([])
    setNewOption('')
    onClose()
  }, [reset, onClose])

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {isEditing ? 'Editar campo' : 'Nuevo campo'}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? 'Modifica la configuración del campo'
                  : 'Define un nuevo campo para expedientes médicos'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-5">
          {/* Field Name */}
          <div className="space-y-2">
            <Label htmlFor="field-name">Nombre del campo *</Label>
            <Input
              id="field-name"
              placeholder="Ej: Presion arterial"
              error={!!errors.name}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.name.message}
              </p>
            )}
            {!isEditing && generatedId && (
              <p className="text-xs text-muted-foreground">
                ID generado:{' '}
                <code className="bg-muted px-1 rounded">{generatedId}</code>
              </p>
            )}
          </div>

          {/* Field Type */}
          <div className="space-y-2">
            <Label>Tipo de campo *</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isEditing} // Can't change type when editing
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((type) => {
                      const Icon = type.icon
                      return (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          className="py-3"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{type.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {type.description}
                              </p>
                            </div>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              )}
            />
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                El tipo de campo no se puede cambiar despues de crearlo.
              </p>
            )}
          </div>

          {/* Select Options */}
          <AnimatePresence>
            {fieldType === 'select' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                <Label>Opciones</Label>

                {/* Option List */}
                {selectOptions.length > 0 && (
                  <div className="space-y-2">
                    {selectOptions.map((option, index) => (
                      <motion.div
                        key={option}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted"
                      >
                        <span className="flex-1 text-sm">{option}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveOption(option)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Add Option */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Nueva opcion..."
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddOption}
                    disabled={!newOption.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {selectOptions.length === 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Agrega al menos una opcion
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Required Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50">
            <div>
              <p className="font-medium text-sm">Campo requerido</p>
              <p className="text-xs text-muted-foreground">
                El usuario deberá completar este campo
              </p>
            </div>
            <Controller
              control={control}
              name="required"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={saving}
              disabled={
                saving ||
                (fieldType === 'select' && selectOptions.length === 0)
              }
              className="flex-1 sm:flex-none sm:min-w-[120px]"
            >
              {saving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear campo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
