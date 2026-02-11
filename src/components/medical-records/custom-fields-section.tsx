/**
 * Custom Fields Section Component
 *
 * Dynamically renders custom fields based on tenant configuration.
 * Supports text, number, boolean, select, and date field types.
 * Fields are stored in the medical record's extras JSONB column.
 *
 * Created: 2026-02-10 - MV2-029 Medical Record Form Modal
 */

'use client'

import { UseFormReturn, Controller } from 'react-hook-form'
import { motion } from 'framer-motion'
import {
  Settings2,
  Type,
  Hash,
  ToggleLeft,
  List,
  Calendar as CalendarIcon,
  AlertCircle,
} from 'lucide-react'
import { format, isValid, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

import { cn } from '@/lib/utils'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import type { CustomField } from '@/types/app'

// =============================================================================
// Types
// =============================================================================

interface CustomFieldsSectionProps {
  /** Array of custom field definitions from tenant config */
  customFields: CustomField[]
  /** React Hook Form instance */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
  /** Field name prefix for extras object */
  fieldPrefix?: string
}

// =============================================================================
// Animation Variants
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
}

// =============================================================================
// Field Type Icons
// =============================================================================

const FIELD_TYPE_ICONS: Record<string, typeof Type> = {
  text: Type,
  number: Hash,
  boolean: ToggleLeft,
  select: List,
  date: CalendarIcon,
}

// =============================================================================
// Component
// =============================================================================

export function CustomFieldsSection({
  customFields,
  form,
  fieldPrefix = 'extras',
}: CustomFieldsSectionProps) {
  const { control, register, formState: { errors } } = form

  if (!customFields || customFields.length === 0) {
    return null
  }

  const getFieldName = (fieldId: string) => `${fieldPrefix}.${fieldId}`

  const getError = (fieldId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extrasErrors = errors[fieldPrefix] as Record<string, any> | undefined
    return extrasErrors?.[fieldId]
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-500/5 dark:from-violet-400/20 dark:to-violet-400/5">
          <Settings2 className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Campos Personalizados
          </h3>
          <p className="text-xs text-muted-foreground">
            Campos adicionales configurados para tu clinica
          </p>
        </div>
      </div>

      {/* Custom Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {customFields.map((field) => (
          <CustomFieldInput
            key={field.id}
            field={field}
            fieldName={getFieldName(field.id)}
            control={control}
            register={register}
            error={getError(field.id)}
          />
        ))}
      </div>
    </motion.div>
  )
}

// =============================================================================
// Custom Field Input Component
// =============================================================================

interface CustomFieldInputProps {
  field: CustomField
  fieldName: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any
}

function CustomFieldInput({
  field,
  fieldName,
  control,
  register,
  error,
}: CustomFieldInputProps) {
  const Icon = FIELD_TYPE_ICONS[field.type] || Type

  const renderField = () => {
    switch (field.type) {
      case 'text':
        return (
          <Input
            id={fieldName}
            type="text"
            placeholder={`Ingresa ${field.name.toLowerCase()}`}
            className={cn(error && 'border-destructive')}
            {...register(fieldName)}
          />
        )

      case 'number':
        return (
          <Input
            id={fieldName}
            type="number"
            step="any"
            placeholder="0"
            className={cn(error && 'border-destructive')}
            {...register(fieldName, {
              setValueAs: (v: string) => v === '' ? null : parseFloat(v),
            })}
          />
        )

      case 'boolean':
        return (
          <Controller
            name={fieldName}
            control={control}
            render={({ field: formField }) => (
              <div className="flex items-center gap-3 h-11">
                <Switch
                  id={fieldName}
                  checked={formField.value === true}
                  onCheckedChange={formField.onChange}
                />
                <span className="text-sm text-muted-foreground">
                  {formField.value ? 'Si' : 'No'}
                </span>
              </div>
            )}
          />
        )

      case 'select':
        return (
          <Controller
            name={fieldName}
            control={control}
            render={({ field: formField }) => (
              <Select
                value={formField.value ?? ''}
                onValueChange={formField.onChange}
              >
                <SelectTrigger
                  className={cn(error && 'border-destructive')}
                >
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )

      case 'date':
        return (
          <Controller
            name={fieldName}
            control={control}
            render={({ field: formField }) => {
              const dateValue = formField.value
                ? typeof formField.value === 'string'
                  ? parseISO(formField.value)
                  : formField.value
                : undefined

              return (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal h-11',
                        !dateValue && 'text-muted-foreground',
                        error && 'border-destructive'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateValue && isValid(dateValue) ? (
                        format(dateValue, "d 'de' MMMM, yyyy", { locale: es })
                      ) : (
                        <span>Selecciona una fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      selected={dateValue && isValid(dateValue) ? dateValue : undefined}
                      onSelect={(date) => {
                        formField.onChange(date ? format(date, 'yyyy-MM-dd') : null)
                      }}
                    />
                  </PopoverContent>
                </Popover>
              )
            }}
          />
        )

      default:
        return (
          <Input
            id={fieldName}
            type="text"
            placeholder={`Ingresa ${field.name.toLowerCase()}`}
            className={cn(error && 'border-destructive')}
            {...register(fieldName)}
          />
        )
    }
  }

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        'space-y-2',
        field.type === 'boolean' && 'flex items-center gap-4'
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-violet-500/70 dark:text-violet-400/70" />
        <Label
          htmlFor={fieldName}
          className="text-foreground/80"
        >
          {field.name}
          {field.required && (
            <span className="text-destructive ml-1">*</span>
          )}
        </Label>
      </div>
      {renderField()}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-destructive flex items-center gap-1"
        >
          <AlertCircle className="h-3 w-3" />
          {error.message as string}
        </motion.p>
      )}
    </motion.div>
  )
}
