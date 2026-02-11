/**
 * Patient List Component
 *
 * Displays páginated list of patients in a table format with:
 * - Search filtering with debounce
 * - Row click navigation to patient detail
 * - Loading skeleton states
 * - Empty state with CTA
 * - Pagination controls
 *
 * Created: 2026-02-10 - MV2-016 Patient list page
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { getPatients } from '@/actions/patients'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PatientSearch } from './patient-search'

import type { Patient } from '@/types/app'

// =============================================================================
// Constants
// =============================================================================

const PATIENTS_PER_PAGE = 10

// =============================================================================
// Types
// =============================================================================

interface PatientListProps {
  onCreatePatient?: () => void
}

// =============================================================================
// Sub-components
// =============================================================================

function PatientTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50"
        >
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-4 w-24 hidden md:block" />
          <Skeleton className="h-4 w-28 hidden md:block" />
        </motion.div>
      ))}
    </div>
  )
}

function EmptyState({ onCreatePatient }: { onCreatePatient?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      {/* Decorative background */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full blur-2xl scale-150" />
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20"
        >
          <Users className="w-10 h-10 text-primary" />
        </motion.div>
      </div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold text-foreground mb-2"
      >
        Sin pacientes registrados
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-center max-w-sm mb-6"
      >
        Comienza agregando tu primer paciente para gestionar sus citas y expedientes médicos.
      </motion.p>

      {onCreatePatient && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button onClick={onCreatePatient} size="lg" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Agregar Primer Paciente
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}

function NoSearchResults({ searchTerm }: { searchTerm: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-12 px-4"
    >
      <div className="w-14 h-14 rounded-xl bg-muted/50 flex items-center justify-center mb-4">
        <AlertCircle className="w-7 h-7 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground text-center">
        No se encontraron pacientes para{' '}
        <span className="font-medium text-foreground">&ldquo;{searchTerm}&rdquo;</span>
      </p>
    </motion.div>
  )
}

function PatientRow({
  patient,
  onClick,
  index,
}: {
  patient: Patient
  onClick: () => void
  index: number
}) {
  const fullName = `${patient.first_name} ${patient.last_name}`.trim()
  const initials = `${patient.first_name[0] || ''}${patient.last_name[0] || ''}`.toUpperCase()

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      onClick={onClick}
      className={cn(
        'group cursor-pointer',
        'border-b border-border/50 last:border-0',
        'hover:bg-primary/[0.03] dark:hover:bg-primary/[0.06]',
        'transition-colors duration-150'
      )}
    >
      {/* Name column with avatar */}
      <TableCell className="py-3.5">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-border/50">
            <AvatarImage src={patient.photo_url || undefined} alt={fullName} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
              {fullName}
            </p>
            {/* Show email on mobile under name */}
            <p className="text-xs text-muted-foreground truncate md:hidden">
              {patient.email || 'Sin correo'}
            </p>
          </div>
        </div>
      </TableCell>

      {/* Email column - hidden on mobile */}
      <TableCell className="hidden md:table-cell py-3.5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate max-w-[200px]">
            {patient.email || <span className="text-muted-foreground/60">---</span>}
          </span>
        </div>
      </TableCell>

      {/* Phone column - hidden on mobile */}
      <TableCell className="hidden md:table-cell py-3.5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{patient.phone || <span className="text-muted-foreground/60">---</span>}</span>
        </div>
      </TableCell>

      {/* Hover indicator */}
      <TableCell className="w-8 py-3.5">
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </TableCell>
    </motion.tr>
  )
}

function Pagination({
  currentPage,
  totalPages,
  totalPatients,
  onPageChange,
  isLoading,
}: {
  currentPage: number
  totalPages: number
  totalPatients: number
  onPageChange: (page: number) => void
  isLoading: boolean
}) {
  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * PATIENTS_PER_PAGE + 1
  const endItem = Math.min(currentPage * PATIENTS_PER_PAGE, totalPatients)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-between px-2 py-4 border-t border-border/50"
    >
      <p className="text-sm text-muted-foreground">
        Mostrando{' '}
        <span className="font-medium text-foreground">{startItem}-{endItem}</span>
        {' '}de{' '}
        <span className="font-medium text-foreground">{totalPatients}</span>
        {' '}pacientes
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>

        <div className="flex items-center gap-1 px-2">
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
            let pageNum: number
            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (currentPage <= 3) {
              pageNum = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = currentPage - 2 + i
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                disabled={isLoading}
                className={cn(
                  'w-8 h-8 text-sm rounded-md transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                  pageNum === currentPage
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className="gap-1"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function PatientList({ onCreatePatient }: PatientListProps) {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Fetch patients
  const fetchPatients = useCallback(async (page: number, search: string) => {
    setIsLoading(true)
    try {
      const result = await getPatients({
        page,
        limit: PATIENTS_PER_PAGE,
        search: search || undefined,
      })

      if (result.success) {
        setPatients(result.data.patients)
        setTotal(result.data.total)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Error al cargar pacientes')
    } finally {
      setIsLoading(false)
      setIsInitialLoad(false)
    }
  }, [])

  // Initial load and search/page changes
  useEffect(() => {
    fetchPatients(currentPage, searchTerm)
  }, [currentPage, searchTerm, fetchPatients])

  // Handle search
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)
    setCurrentPage(1) // Reset to first page on search
  }, [])

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    // Smooth scroll to top of list
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Handle row click
  const handleRowClick = useCallback(
    (patientId: string) => {
      router.push(`/patients/${patientId}`)
    },
    [router]
  )

  const totalPages = Math.ceil(total / PATIENTS_PER_PAGE)
  const hasNoPatients = !isLoading && patients.length === 0 && !searchTerm
  const hasNoSearchResults = !isLoading && patients.length === 0 && searchTerm

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Pacientes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total > 0 ? (
              <>
                {total} paciente{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
              </>
            ) : (
              'Gestiona los pacientes de tu clínica'
            )}
          </p>
        </div>

        {onCreatePatient && !hasNoPatients && (
          <Button onClick={onCreatePatient} className="gap-2 w-full sm:w-auto">
            <UserPlus className="w-4 h-4" />
            Nuevo Paciente
          </Button>
        )}
      </div>

      {/* Search bar - only show if there are patients or searching */}
      {!hasNoPatients && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <PatientSearch onSearch={handleSearch} initialValue={searchTerm} />
        </motion.div>
      )}

      {/* Content area */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
        <AnimatePresence mode="wait">
          {isInitialLoad ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              <PatientTableSkeleton />
            </motion.div>
          ) : hasNoPatients ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmptyState onCreatePatient={onCreatePatient} />
            </motion.div>
          ) : hasNoSearchResults ? (
            <motion.div
              key="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <NoSearchResults searchTerm={searchTerm} />
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="w-[40%]">Nombre</TableHead>
                    <TableHead className="hidden md:table-cell">Correo</TableHead>
                    <TableHead className="hidden md:table-cell">Teléfono</TableHead>
                    <TableHead className="w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient, index) => (
                    <PatientRow
                      key={patient.id}
                      patient={patient}
                      onClick={() => handleRowClick(patient.id)}
                      index={index}
                    />
                  ))}
                </TableBody>
              </Table>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalPatients={total}
                onPageChange={handlePageChange}
                isLoading={isLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading overlay for subsequent loads */}
        <AnimatePresence>
          {isLoading && !isInitialLoad && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/50 backdrop-blur-[2px] flex items-center justify-center z-10"
            >
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
