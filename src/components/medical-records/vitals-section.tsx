/**
 * Vitals Section Component
 *
 * Sub-form for capturing patient vital signs during a medical record entry.
 * Includes height, weight, blood pressure, and temperature fields with
 * proper validation and unit indicators.
 *
 * Created: 2026-02-10 - MV2-029 Medical Record Form Modal
 */

'use client'

import { UseFormReturn } from 'react-hook-form'
import { motion } from 'framer-motion'
import {
  Ruler,
  Scale,
  Heart,
  Thermometer,
  Activity,
  AlertCircle,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// =============================================================================
// Types
// =============================================================================

export interface VitalsFormValues {
  heightCm?: number | null
  weightKg?: number | null
  bloodPressure?: string
  temperatureC?: number | null
}

interface VitalsSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
  /** Prefix for field names if nested in a larger form */
  fieldPrefix?: string
  /** Whether to show section in collapsed state initially */
  collapsed?: boolean
}

// =============================================================================
// Animation Variants
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

// =============================================================================
// Component
// =============================================================================

export function VitalsSection({
  form,
  fieldPrefix = '',
}: VitalsSectionProps) {
  const { register, formState: { errors } } = form

  const getFieldName = (name: string) =>
    fieldPrefix ? `${fieldPrefix}.${name}` : name

  const getError = (name: string) => {
    if (fieldPrefix) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prefixErrors = errors[fieldPrefix] as Record<string, any> | undefined
      return prefixErrors?.[name]
    }
    return errors[name]
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
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5">
          <Activity className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Signos Vitales
          </h3>
          <p className="text-xs text-muted-foreground">
            Opcional - registra los signos vitales del paciente
          </p>
        </div>
      </div>

      {/* Vitals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Height Field */}
        <motion.div variants={itemVariants} className="space-y-2">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-primary/70" />
            <Label
              htmlFor={getFieldName('heightCm')}
              className="text-foreground/80"
            >
              Altura
            </Label>
          </div>
          <div className="relative">
            <Input
              id={getFieldName('heightCm')}
              type="number"
              step="0.1"
              min="0"
              max="300"
              placeholder="170"
              className={cn(
                'pr-12',
                getError('heightCm') && 'border-destructive'
              )}
              {...register(getFieldName('heightCm'), {
                setValueAs: (v: string) => v === '' ? null : parseFloat(v),
              })}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              cm
            </span>
          </div>
          {getError('heightCm') && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-destructive flex items-center gap-1"
            >
              <AlertCircle className="h-3 w-3" />
              {getError('heightCm')?.message as string}
            </motion.p>
          )}
        </motion.div>

        {/* Weight Field */}
        <motion.div variants={itemVariants} className="space-y-2">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary/70" />
            <Label
              htmlFor={getFieldName('weightKg')}
              className="text-foreground/80"
            >
              Peso
            </Label>
          </div>
          <div className="relative">
            <Input
              id={getFieldName('weightKg')}
              type="number"
              step="0.1"
              min="0"
              max="500"
              placeholder="70"
              className={cn(
                'pr-12',
                getError('weightKg') && 'border-destructive'
              )}
              {...register(getFieldName('weightKg'), {
                setValueAs: (v: string) => v === '' ? null : parseFloat(v),
              })}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              kg
            </span>
          </div>
          {getError('weightKg') && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-destructive flex items-center gap-1"
            >
              <AlertCircle className="h-3 w-3" />
              {getError('weightKg')?.message as string}
            </motion.p>
          )}
        </motion.div>

        {/* Blood Pressure Field */}
        <motion.div variants={itemVariants} className="space-y-2">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary/70" />
            <Label
              htmlFor={getFieldName('bloodPressure')}
              className="text-foreground/80"
            >
              Presion arterial
            </Label>
          </div>
          <div className="relative">
            <Input
              id={getFieldName('bloodPressure')}
              type="text"
              placeholder="120/80"
              className={cn(
                'pr-16',
                getError('bloodPressure') && 'border-destructive'
              )}
              {...register(getFieldName('bloodPressure'))}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              mmHg
            </span>
          </div>
          {getError('bloodPressure') && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-destructive flex items-center gap-1"
            >
              <AlertCircle className="h-3 w-3" />
              {getError('bloodPressure')?.message as string}
            </motion.p>
          )}
        </motion.div>

        {/* Temperature Field */}
        <motion.div variants={itemVariants} className="space-y-2">
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-primary/70" />
            <Label
              htmlFor={getFieldName('temperatureC')}
              className="text-foreground/80"
            >
              Temperatura
            </Label>
          </div>
          <div className="relative">
            <Input
              id={getFieldName('temperatureC')}
              type="number"
              step="0.1"
              min="30"
              max="45"
              placeholder="36.5"
              className={cn(
                'pr-10',
                getError('temperatureC') && 'border-destructive'
              )}
              {...register(getFieldName('temperatureC'), {
                setValueAs: (v: string) => v === '' ? null : parseFloat(v),
              })}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              °C
            </span>
          </div>
          {getError('temperatureC') && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-destructive flex items-center gap-1"
            >
              <AlertCircle className="h-3 w-3" />
              {getError('temperatureC')?.message as string}
            </motion.p>
          )}
        </motion.div>
      </div>

      {/* BMI Indicator (calculated from height/weight if both present) */}
      <VitalsBMIIndicator form={form} fieldPrefix={fieldPrefix} />
    </motion.div>
  )
}

// =============================================================================
// BMI Indicator Sub-component
// =============================================================================

interface VitalsBMIIndicatorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
  fieldPrefix?: string
}

function VitalsBMIIndicator({ form, fieldPrefix = '' }: VitalsBMIIndicatorProps) {
  const heightCm = form.watch(fieldPrefix ? `${fieldPrefix}.heightCm` : 'heightCm')
  const weightKg = form.watch(fieldPrefix ? `${fieldPrefix}.weightKg` : 'weightKg')

  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    return null
  }

  const heightM = heightCm / 100
  const bmi = weightKg / (heightM * heightM)
  const bmiRounded = Math.round(bmi * 10) / 10

  let bmiCategory: string
  let bmiColor: string

  if (bmi < 18.5) {
    bmiCategory = 'Bajo peso'
    bmiColor = 'text-amber-600 dark:text-amber-400'
  } else if (bmi < 25) {
    bmiCategory = 'Normal'
    bmiColor = 'text-emerald-600 dark:text-emerald-400'
  } else if (bmi < 30) {
    bmiCategory = 'Sobrepeso'
    bmiColor = 'text-amber-600 dark:text-amber-400'
  } else {
    bmiCategory = 'Obesidad'
    bmiColor = 'text-red-600 dark:text-red-400'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
        <Activity className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">
          Indice de masa corporal (IMC)
        </p>
        <p className={cn('text-sm font-semibold', bmiColor)}>
          {bmiRounded} - {bmiCategory}
        </p>
      </div>
    </motion.div>
  )
}
