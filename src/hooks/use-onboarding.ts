/**
 * Onboarding Progress Hook
 *
 * Manages onboarding state and step completion for new users.
 * Reads from tenant data and provides actions to complete steps.
 *
 * Created: 2026-02-10 - MV2-057 Onboarding Tutorial System
 */

'use client'

import { useCallback, useMemo, useTransition } from 'react'
import {
  UserPlus,
  CalendarPlus,
  Eye,
  CheckCircle2,
  Settings,
  type LucideIcon,
} from 'lucide-react'

import { useUser } from '@/hooks/use-user'
import { completeOnboardingStep } from '@/actions/settings'

/**
 * Onboarding step identifier.
 */
export type OnboardingStepId =
  | 'create_patient'
  | 'create_appointment'
  | 'view_appointment'
  | 'complete_appointment'
  | 'visit_settings'

/**
 * Individual onboarding step data.
 */
export interface OnboardingStep {
  id: OnboardingStepId
  label: string
  description: string
  icon: LucideIcon
  completed: boolean
  href?: string
}

/**
 * Return type for the useOnboarding hook.
 */
export interface UseOnboardingReturn {
  /** All onboarding steps with their completion status */
  steps: OnboardingStep[]
  /** Number of completed steps */
  completedCount: number
  /** Total number of steps */
  totalSteps: number
  /** Completion percentage (0-100) */
  progressPercent: number
  /** Whether all steps are complete */
  isComplete: boolean
  /** Whether onboarding data is still loading */
  isLoading: boolean
  /** Whether a step completion is in progress */
  isPending: boolean
  /** Mark a step as complete */
  completeStep: (stepId: OnboardingStepId) => Promise<void>
}

/**
 * Step configuration with metadata.
 */
const STEP_CONFIG: Array<{
  id: OnboardingStepId
  label: string
  description: string
  icon: LucideIcon
  href?: string
}> = [
  {
    id: 'create_patient',
    label: 'Crear paciente',
    description: 'Registra tu primer paciente en el sistema',
    icon: UserPlus,
    href: '/patients',
  },
  {
    id: 'create_appointment',
    label: 'Agendar cita',
    description: 'Programa una cita para un paciente',
    icon: CalendarPlus,
    href: '/dashboard',
  },
  {
    id: 'view_appointment',
    label: 'Ver cita',
    description: 'Consulta los detalles de una cita agendada',
    icon: Eye,
    href: '/dashboard',
  },
  {
    id: 'complete_appointment',
    label: 'Completar consulta',
    description: 'Finaliza una consulta y guarda el registro médico',
    icon: CheckCircle2,
  },
  {
    id: 'visit_settings',
    label: 'Visitar configuración',
    description: 'Personaliza tu clínica en configuración',
    icon: Settings,
    href: '/settings',
  },
]

/**
 * Hook for managing onboarding progress.
 *
 * Reads onboarding flags from tenant data and provides
 * actions to mark steps as complete.
 *
 * @returns Onboarding state and actions
 *
 * @example
 * ```tsx
 * function OnboardingWidget() {
 *   const { steps, progressPercent, isComplete, completeStep } = useOnboarding()
 *
 *   if (isComplete) return null
 *
 *   return (
 *     <div>
 *       <progress value={progressPercent} max={100} />
 *       {steps.map(step => (
 *         <div key={step.id}>
 *           {step.label}: {step.completed ? 'Done' : 'Pending'}
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useOnboarding(): UseOnboardingReturn {
  const { tenant, dataLoading, refreshUser } = useUser()
  const [isPending, startTransition] = useTransition()

  // Build steps array with completion status from tenant data
  const steps = useMemo<OnboardingStep[]>(() => {
    if (!tenant) {
      return STEP_CONFIG.map((config) => ({
        ...config,
        completed: false,
      }))
    }

    return STEP_CONFIG.map((config) => {
      let completed = false

      switch (config.id) {
        case 'create_patient':
          completed = tenant.onboarding_create_patient
          break
        case 'create_appointment':
          completed = tenant.onboarding_create_appointment
          break
        case 'view_appointment':
          completed = tenant.onboarding_view_appointment
          break
        case 'complete_appointment':
          completed = tenant.onboarding_complete_appointment
          break
        case 'visit_settings':
          completed = tenant.onboarding_visit_settings
          break
      }

      return {
        ...config,
        completed,
      }
    })
  }, [tenant])

  const completedCount = useMemo(
    () => steps.filter((s) => s.completed).length,
    [steps]
  )

  const totalSteps = steps.length

  const progressPercent = useMemo(
    () => Math.round((completedCount / totalSteps) * 100),
    [completedCount, totalSteps]
  )

  const isComplete = completedCount === totalSteps

  const completeStep = useCallback(
    async (stepId: OnboardingStepId) => {
      // Check if already completed
      const step = steps.find((s) => s.id === stepId)
      if (step?.completed) return

      startTransition(async () => {
        const result = await completeOnboardingStep(stepId)

        if (result.success) {
          // Refresh user context to get updated tenant data
          await refreshUser()
        } else {
          console.error('Failed to complete onboarding step:', result.error)
        }
      })
    },
    [steps, refreshUser]
  )

  return {
    steps,
    completedCount,
    totalSteps,
    progressPercent,
    isComplete,
    isLoading: dataLoading,
    isPending,
    completeStep,
  }
}
