/**
 * Patient Header Component
 *
 * Displays patient demographics: photo, name, age, sex, patient ID with edit button.
 * Features a refined medical aesthetic with subtle gradients and clean typography.
 *
 * Created: 2026-02-10 - MV2-018 Patient Detail Page
 */

'use client'

import { useCallback, useRef, useState } from 'react'
import { differenceInYears, parseISO, format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Pencil,
  Camera,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { uploadPatientPhoto } from '@/actions/patients'
import type { Patient } from '@/types/app'

interface PatientHeaderProps {
  patient: Patient
  onEditClick: () => void
  onPhotoUpdated?: (newUrl: string) => void
}

export function PatientHeader({
  patient,
  onEditClick,
  onPhotoUpdated,
}: PatientHeaderProps) {
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const age = differenceInYears(new Date(), parseISO(patient.birth_date))
  const birthDateFormatted = format(parseISO(patient.birth_date), "d 'de' MMMM, yyyy", {
    locale: es,
  })

  const sexLabel = {
    M: 'Masculino',
    F: 'Femenino',
    O: 'Otro',
  }[patient.sex]

  const patientNumber = `PAT-${String(patient.patient_number).padStart(6, '0')}`

  const initials = `${patient.first_name.charAt(0)}${patient.last_name.charAt(0)}`.toUpperCase()
  const fullName = `${patient.first_name} ${patient.last_name}`.trim()

  const handlePhotoClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      setIsUploadingPhoto(true)
      try {
        const formData = new FormData()
        formData.append('file', file)

        const result = await uploadPatientPhoto(patient.id, formData)
        if (result.success) {
          toast.success('Foto actualizada')
          onPhotoUpdated?.(result.data)
        } else {
          toast.error(result.error)
        }
      } catch (error) {
        console.error('Error uploading photo:', error)
        toast.error('Error al subir la foto')
      } finally {
        setIsUploadingPhoto(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    [patient.id, onPhotoUpdated]
  )

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
      {/* Subtle gradient background decoration */}
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-64 w-64 opacity-[0.08]"
        style={{
          background: 'radial-gradient(circle, var(--primary), transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 opacity-[0.05]"
        style={{
          background: 'radial-gradient(circle, var(--primary), transparent 70%)',
        }}
      />

      <div className="relative p-4 md:p-6">
        {/* Mobile Layout */}
        <div className="flex flex-col gap-4 md:hidden">
          {/* Top row: Avatar and Edit button */}
          <div className="flex items-start justify-between">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-md">
                <AvatarImage src={patient.photo_url || undefined} alt={fullName} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-xl font-semibold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handlePhotoClick}
                disabled={isUploadingPhoto}
                className={cn(
                  'absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center',
                  'rounded-full border-2 border-card bg-primary text-primary-foreground shadow-md',
                  'transition-transform hover:scale-110 active:scale-95',
                  'disabled:opacity-50'
                )}
              >
                {isUploadingPhoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={onEditClick}>
              <Pencil className="h-4 w-4" />
              <span className="ml-1">Editar</span>
            </Button>
          </div>

          {/* Patient info */}
          <div className="space-y-2">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                {fullName}
              </h1>
              <p className="text-sm font-medium text-primary">{patientNumber}</p>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {age} anos - {sexLabel}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {birthDateFormatted}
              </span>
            </div>
          </div>

          {/* Contact info pills */}
          <div className="flex flex-wrap gap-2">
            {patient.phone && (
              <a
                href={`tel:${patient.phone}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Phone className="h-3 w-3" />
                {patient.phone}
              </a>
            )}
            {patient.email && (
              <a
                href={`mailto:${patient.email}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Mail className="h-3 w-3" />
                {patient.email}
              </a>
            )}
          </div>

          {/* Allergies warning */}
          {patient.allergies && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Alergias</p>
                <p className="text-destructive/80">{patient.allergies}</p>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex md:items-start md:gap-6">
          {/* Avatar with upload button */}
          <div className="relative shrink-0">
            <Avatar className="h-28 w-28 border-4 border-primary/10 shadow-lg ring-4 ring-primary/5">
              <AvatarImage src={patient.photo_url || undefined} alt={fullName} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-3xl font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={handlePhotoClick}
              disabled={isUploadingPhoto}
              className={cn(
                'absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center',
                'rounded-full border-2 border-card bg-primary text-primary-foreground shadow-lg',
                'transition-all hover:scale-110 hover:shadow-xl active:scale-95',
                'disabled:opacity-50'
              )}
            >
              {isUploadingPhoto ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Patient info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    {fullName}
                  </h1>
                  <span className="rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
                    {patientNumber}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4" />
                    {age} anos - {sexLabel}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {birthDateFormatted}
                  </span>
                </div>
              </div>
              <Button variant="outline" onClick={onEditClick}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar paciente
              </Button>
            </div>

            {/* Contact and address info */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {patient.phone && (
                <a
                  href={`tel:${patient.phone}`}
                  className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Phone className="h-4 w-4" />
                  {patient.phone}
                </a>
              )}
              {patient.email && (
                <a
                  href={`mailto:${patient.email}`}
                  className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Mail className="h-4 w-4" />
                  {patient.email}
                </a>
              )}
              {patient.address && (
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {patient.address}
                </span>
              )}
            </div>

            {/* Allergies warning */}
            {patient.allergies && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Alergias conocidas</p>
                  <p className="text-destructive/80">{patient.allergies}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}

export function PatientHeaderSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
      <div className="p-4 md:p-6">
        {/* Mobile skeleton */}
        <div className="flex flex-col gap-4 md:hidden">
          <div className="flex items-start justify-between">
            <div className="h-20 w-20 animate-pulse rounded-full bg-muted" />
            <div className="h-9 w-20 animate-pulse rounded-lg bg-muted" />
          </div>
          <div className="space-y-2">
            <div className="h-6 w-40 animate-pulse rounded bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          </div>
        </div>

        {/* Desktop skeleton */}
        <div className="hidden md:flex md:items-start md:gap-6">
          <div className="h-28 w-28 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-48 animate-pulse rounded bg-muted" />
                  <div className="h-6 w-24 animate-pulse rounded-md bg-muted" />
                </div>
                <div className="h-5 w-64 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-10 w-36 animate-pulse rounded-lg bg-muted" />
            </div>
            <div className="flex gap-4">
              <div className="h-5 w-32 animate-pulse rounded bg-muted" />
              <div className="h-5 w-40 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
