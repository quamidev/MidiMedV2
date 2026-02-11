/**
 * Multi-step signup wizard for new user and clinic registration.
 * 4 steps: Personal Info -> Clinic Info -> Review -> Password
 *
 * Created: 2026-02-10 - MV2-011 Signup wizard UI
 */

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  User,
  Building2,
  ClipboardCheck,
  Lock,
  ChevronRight,
  ChevronLeft,
  Check,
  Stethoscope,
  Mail,
  Phone,
  MapPin,
  Eye,
  EyeOff,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { signUp } from '@/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

// =============================================================================
// Constants
// =============================================================================

const SPECIALTIES = [
  'Medicina General',
  'Pediatria',
  'Ginecologia',
  'Cardiologia',
  'Dermatologia',
  'Oftalmologia',
  'Traumatologia',
  'Nutricion',
  'Psicologia',
  'Odontologia',
] as const

const STEPS = [
  { id: 1, title: 'Datos personales', icon: User },
  { id: 2, title: 'Clinica', icon: Building2 },
  { id: 3, title: 'Revisar', icon: ClipboardCheck },
  { id: 4, title: 'Contrasena', icon: Lock },
] as const

// =============================================================================
// Validation Schema
// =============================================================================

const signupSchema = z.object({
  // Step 1: Personal Info
  displayName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre es muy largo'),
  email: z
    .string()
    .min(1, 'El correo es requerido')
    .email('Correo electronico invalido'),
  phone: z.string().optional(),

  // Step 2: Clinic Info
  clinicName: z
    .string()
    .min(2, 'El nombre de la clinica debe tener al menos 2 caracteres')
    .max(100, 'El nombre es muy largo'),
  address: z.string().optional(),
  specialties: z.array(z.string()).optional(),

  // Step 4: Password
  password: z
    .string()
    .min(6, 'La contrasena debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirma tu contrasena'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contrasenas no coinciden',
  path: ['confirmPassword'],
})

type SignupFormData = z.infer<typeof signupSchema>

// =============================================================================
// Step Components
// =============================================================================

interface StepProps {
  form: UseFormReturn<SignupFormData>
}

function PersonalInfoStep({ form }: StepProps) {
  const { register, formState: { errors } } = form

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <Label htmlFor="displayName">Nombre completo *</Label>
        </div>
        <Input
          id="displayName"
          placeholder="Dr. Juan Perez"
          error={!!errors.displayName}
          {...register('displayName')}
        />
        {errors.displayName && (
          <p className="text-sm text-destructive">{errors.displayName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          <Label htmlFor="email">Correo electronico *</Label>
        </div>
        <Input
          id="email"
          type="email"
          placeholder="doctor@clinica.com"
          error={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" />
          <Label htmlFor="phone">Telefono (opcional)</Label>
        </div>
        <Input
          id="phone"
          type="tel"
          placeholder="+502 5555 1234"
          {...register('phone')}
        />
      </div>
    </div>
  )
}

function ClinicInfoStep({ form }: StepProps) {
  const { register, watch, setValue, formState: { errors } } = form
  const selectedSpecialties = watch('specialties') || []

  const toggleSpecialty = (specialty: string) => {
    const current = form.getValues('specialties') || []
    if (current.includes(specialty)) {
      setValue('specialties', current.filter((s) => s !== specialty))
    } else {
      setValue('specialties', [...current, specialty])
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <Label htmlFor="clinicName">Nombre de la clinica *</Label>
        </div>
        <Input
          id="clinicName"
          placeholder="Clinica Medica Central"
          error={!!errors.clinicName}
          {...register('clinicName')}
        />
        {errors.clinicName && (
          <p className="text-sm text-destructive">{errors.clinicName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <Label htmlFor="address">Direccion (opcional)</Label>
        </div>
        <Input
          id="address"
          placeholder="Zona 10, Ciudad de Guatemala"
          {...register('address')}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-primary" />
          <Label>Especialidades (opcional)</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Selecciona las especialidades que ofrece tu clinica
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SPECIALTIES.map((specialty) => (
            <label
              key={specialty}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200',
                'hover:border-primary/50 hover:bg-primary/5',
                selectedSpecialties.includes(specialty)
                  ? 'border-primary bg-primary/10'
                  : 'border-input'
              )}
            >
              <Checkbox
                checked={selectedSpecialties.includes(specialty)}
                onCheckedChange={() => toggleSpecialty(specialty)}
              />
              <span className="text-sm font-medium">{specialty}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

function ReviewStep({ form }: StepProps) {
  const { watch } = form
  const data = watch()

  const reviewSections = [
    {
      title: 'Datos personales',
      icon: User,
      items: [
        { label: 'Nombre', value: data.displayName },
        { label: 'Correo', value: data.email },
        { label: 'Telefono', value: data.phone || 'No especificado' },
      ],
    },
    {
      title: 'Clinica',
      icon: Building2,
      items: [
        { label: 'Nombre de la clinica', value: data.clinicName },
        { label: 'Direccion', value: data.address || 'No especificada' },
        {
          label: 'Especialidades',
          value: data.specialties?.length
            ? data.specialties.join(', ')
            : 'Ninguna seleccionada',
        },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <ClipboardCheck className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Revisa tu informacion</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Verifica que todos los datos sean correctos antes de continuar
        </p>
      </div>

      <div className="space-y-4">
        {reviewSections.map((section) => (
          <div
            key={section.title}
            className="rounded-xl border border-border bg-card p-4 space-y-3"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <section.icon className="h-4 w-4" />
              {section.title}
            </div>
            <div className="space-y-2">
              {section.items.map((item) => (
                <div key={item.label} className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium text-right max-w-[60%] break-words">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
        <p className="text-sm text-center text-muted-foreground">
          En el siguiente paso crearas tu contrasena para acceder a MidiMed
        </p>
      </div>
    </div>
  )
}

function PasswordStep({ form }: StepProps) {
  const { register, formState: { errors } } = form
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Crea tu contrasena</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Elige una contrasena segura para proteger tu cuenta
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contrasena *</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Minimo 6 caracteres"
            error={!!errors.password}
            className="pr-12"
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar contrasena *</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Repite tu contrasena"
            error={!!errors.confirmPassword}
            className="pr-12"
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="rounded-lg bg-muted/50 p-4 space-y-2">
        <p className="text-sm font-medium">Tu contrasena debe tener:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            Al menos 6 caracteres
          </li>
        </ul>
      </div>
    </div>
  )
}

// =============================================================================
// Progress Indicator
// =============================================================================

interface ProgressIndicatorProps {
  currentStep: number
}

function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  return (
    <div className="mb-8">
      {/* Mobile: Simple step counter */}
      <div className="flex md:hidden items-center justify-center gap-2 text-sm">
        <span className="font-medium text-primary">Paso {currentStep}</span>
        <span className="text-muted-foreground">de {STEPS.length}</span>
      </div>

      {/* Desktop: Full step indicator */}
      <div className="hidden md:flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > step.id
          const isCurrent = currentStep === step.id
          const Icon = step.icon

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary/10 text-primary ring-2 ring-primary ring-offset-2',
                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium transition-colors',
                    isCurrent ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
              </div>

              {index < STEPS.length - 1 && (
                <div className="flex-1 mx-4">
                  <div
                    className={cn(
                      'h-0.5 w-full transition-colors duration-300',
                      currentStep > step.id ? 'bg-primary' : 'bg-border'
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile: Progress bar */}
      <div className="md:hidden mt-4">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
          />
        </div>
        <p className="text-center text-sm text-muted-foreground mt-3">
          {STEPS[currentStep - 1]?.title}
        </p>
      </div>
    </div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function SignupWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
    defaultValues: {
      displayName: '',
      email: '',
      phone: '',
      clinicName: '',
      address: '',
      specialties: [],
      password: '',
      confirmPassword: '',
    },
  })

  const validateStep = useCallback(async (step: number) => {
    const fieldsToValidate: (keyof SignupFormData)[][] = [
      ['displayName', 'email', 'phone'],
      ['clinicName', 'address', 'specialties'],
      [], // Review step - no validation needed
      ['password', 'confirmPassword'],
    ]

    const fields = fieldsToValidate[step - 1]
    if (!fields || fields.length === 0) return true

    const result = await form.trigger(fields)
    return result
  }, [form])

  const handleNext = useCallback(async () => {
    const isValid = await validateStep(currentStep)
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length))
    }
  }, [currentStep, validateStep])

  const handleBack = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }, [])

  const handleSubmit = useCallback(async (data: SignupFormData) => {
    setIsSubmitting(true)

    try {
      const result = await signUp({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        clinicName: data.clinicName,
        phone: data.phone || undefined,
        address: data.address || undefined,
        specialties: data.specialties || undefined,
      })

      if (result.success) {
        toast.success('Cuenta creada exitosamente', {
          description: 'Bienvenido a MidiMed. Redirigiendo...',
        })
        router.push('/dashboard')
      } else {
        toast.error('Error al crear la cuenta', {
          description: result.error,
        })
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('Error inesperado', {
        description: 'Por favor intenta de nuevo.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [router])

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep form={form} />
      case 2:
        return <ClinicInfoStep form={form} />
      case 3:
        return <ReviewStep form={form} />
      case 4:
        return <PasswordStep form={form} />
      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <ProgressIndicator currentStep={currentStep} />

      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div
          className="min-h-[400px] transition-opacity duration-200"
          key={currentStep}
        >
          {renderStep()}
        </div>

        <div className="flex gap-3 mt-8 pt-6 border-t border-border">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex-1"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Atras
            </Button>
          )}

          {currentStep < STEPS.length ? (
            <Button
              type="button"
              onClick={handleNext}
              className={cn('flex-1', currentStep === 1 && 'w-full')}
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          )}
        </div>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-8">
        Ya tienes una cuenta?{' '}
        <a
          href="/login"
          className="text-primary font-medium hover:underline transition-colors"
        >
          Inicia sesion
        </a>
      </p>
    </div>
  )
}
