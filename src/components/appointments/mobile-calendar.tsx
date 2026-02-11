/**
 * MobileCalendar - Mobile-optimized day view calendar for appointments
 *
 * Features:
 * - Day view with personalized greeting header
 * - Tabs for "Pendientes" (scheduled) / "Completadas" (completed)
 * - Date navigation with arrow buttons
 * - FAB button for new appointment
 * - Swipeable date navigation (optional gesture support)
 * - Fetches appointments for selected day
 * - Shows AppointmentPopup on tap
 *
 * Created: 2026-02-10 - MV2-027 Mobile Calendar View
 */

'use client'

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react'
import {
  format,
  addDays,
  subDays,
  startOfDay,
  isSameDay,
  isToday,
} from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Sun,
  Moon,
  Sunrise,
  Clock,
  CheckCircle2,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useUser } from '@/contexts/user-context'
import { getAppointments } from '@/actions/appointments'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MobileAppointmentList, MobileAppointmentListSkeleton } from './mobile-appointment-list'
import { AppointmentPopup } from './appointment-popup'
import type { AppointmentWithRelations } from '@/types/app'

// =============================================================================
// Types
// =============================================================================

export interface MobileCalendarProps {
  onNewAppointment?: () => void
  onEditAppointment?: (appointment: AppointmentWithRelations) => void
  onCompleteAppointment?: (appointment: AppointmentWithRelations) => void
  className?: string
}

type TabType = 'pendientes' | 'completadas'

// =============================================================================
// Helpers
// =============================================================================

function getGreeting(hour: number): {
  text: string
  icon: typeof Sun
  iconClass: string
} {
  if (hour >= 5 && hour < 12) {
    return {
      text: 'Buenos días',
      icon: Sunrise,
      iconClass: 'text-amber-500',
    }
  } else if (hour >= 12 && hour < 19) {
    return {
      text: 'Buenas tardes',
      icon: Sun,
      iconClass: 'text-orange-400',
    }
  } else {
    return {
      text: 'Buenas noches',
      icon: Moon,
      iconClass: 'text-indigo-400',
    }
  }
}

function getFirstName(displayName: string): string {
  return displayName.split(' ')[0] ?? displayName
}

// =============================================================================
// Header Component
// =============================================================================

interface MobileCalendarHeaderProps {
  displayName: string
  currentDate: Date
  scheduledCount: number
  completedCount: number
  onPrevDay: () => void
  onNextDay: () => void
  onGoToday: () => void
  isLoading?: boolean
}

function MobileCalendarHeader({
  displayName,
  currentDate,
  scheduledCount,
  completedCount,
  onPrevDay,
  onNextDay,
  onGoToday,
  isLoading = false,
}: MobileCalendarHeaderProps) {
  const now = useMemo(() => new Date(), [])
  const greeting = useMemo(() => getGreeting(now.getHours()), [now])
  const firstName = useMemo(() => getFirstName(displayName), [displayName])

  const formattedDate = format(currentDate, "EEEE, d 'de' MMMM", { locale: es })
  const isCurrentDay = isToday(currentDate)

  const GreetingIcon = greeting.icon

  return (
    <div
      className={cn(
        'relative overflow-hidden px-4 py-5',
        'bg-gradient-to-br from-primary/5 via-transparent to-primary/3'
      )}
    >
      {/* Decorative background element */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-2xl"
        style={{
          background:
            'radial-gradient(circle, oklch(62% 0.12 195 / 0.4), transparent)',
        }}
      />

      <div className="relative">
        {/* Greeting */}
        <div className="flex items-center gap-2.5">
          <GreetingIcon
            className={cn(
              'h-5 w-5 transition-transform duration-500',
              greeting.iconClass
            )}
            style={{
              animation: 'gentle-pulse 3s ease-in-out infinite',
            }}
          />
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {greeting.text},{' '}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {firstName}
            </span>
          </h1>
        </div>

        {/* Date navigation */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrevDay}
              className="h-8 w-8 rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <button
              type="button"
              onClick={onGoToday}
              className={cn(
                'text-sm font-medium capitalize transition-colors',
                isCurrentDay
                  ? 'text-primary'
                  : 'text-foreground hover:text-primary'
              )}
            >
              {formattedDate}
            </button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onNextDay}
              className="h-8 w-8 rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {!isCurrentDay && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGoToday}
              className="h-7 text-xs"
            >
              Hoy
            </Button>
          )}
        </div>

        {/* Appointment summary */}
        <div className="mt-4 flex items-center gap-3">
          {isLoading ? (
            <Skeleton className="h-8 w-36 rounded-full" />
          ) : (
            <>
              <div className="flex h-8 items-center gap-2 rounded-full bg-sky-500/10 px-3">
                <Clock className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                <span className="text-xs font-medium text-sky-700 dark:text-sky-300">
                  {scheduledCount} pendiente{scheduledCount !== 1 && 's'}
                </span>
              </div>
              <div className="flex h-8 items-center gap-2 rounded-full bg-emerald-500/10 px-3">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {completedCount} completada{completedCount !== 1 && 's'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* CSS for gentle pulse animation */}
      <style jsx>{`
        @keyframes gentle-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  )
}

// =============================================================================
// Tabs Component
// =============================================================================

interface TabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  scheduledCount: number
  completedCount: number
}

function Tabs({
  activeTab,
  onTabChange,
  scheduledCount,
  completedCount,
}: TabsProps) {
  return (
    <div className="flex border-b border-border/50">
      <button
        type="button"
        onClick={() => onTabChange('pendientes')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium',
          'transition-all duration-200 relative',
          activeTab === 'pendientes'
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Clock className="h-4 w-4" />
        <span>Pendientes</span>
        {scheduledCount > 0 && (
          <span
            className={cn(
              'ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold',
              activeTab === 'pendientes'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {scheduledCount}
          </span>
        )}
        {activeTab === 'pendientes' && (
          <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
        )}
      </button>

      <button
        type="button"
        onClick={() => onTabChange('completadas')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium',
          'transition-all duration-200 relative',
          activeTab === 'completadas'
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <CheckCircle2 className="h-4 w-4" />
        <span>Completadas</span>
        {completedCount > 0 && (
          <span
            className={cn(
              'ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold',
              activeTab === 'completadas'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {completedCount}
          </span>
        )}
        {activeTab === 'completadas' && (
          <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
        )}
      </button>
    </div>
  )
}

// =============================================================================
// FAB Component
// =============================================================================

interface FabButtonProps {
  onClick?: () => void
}

function FabButton({ onClick }: FabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'fixed bottom-24 right-4 z-40',
        'flex h-14 w-14 items-center justify-center rounded-full',
        'bg-primary text-primary-foreground shadow-lg',
        'transition-all duration-300 ease-out',
        'hover:scale-105 hover:shadow-xl',
        'active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2'
      )}
      style={{
        boxShadow: '0 4px 20px -4px oklch(62% 0.12 195 / 0.5)',
      }}
    >
      <Plus className="h-6 w-6" />
      <span className="sr-only">Nueva cita</span>
    </button>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export function MobileCalendar({
  onNewAppointment,
  onEditAppointment,
  onCompleteAppointment,
  className,
}: MobileCalendarProps) {
  const { user } = useUser()

  // State
  const [currentDate, setCurrentDate] = useState<Date>(startOfDay(new Date()))
  const [activeTab, setActiveTab] = useState<TabType>('pendientes')
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Popup state
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null)
  const [popupOpen, setPopupOpen] = useState(false)

  // Fetch appointments for current date
  const fetchAppointments = useCallback(async () => {
    setIsLoading(true)

    try {
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      const result = await getAppointments({
        startDate: dateStr,
        endDate: dateStr,
      })

      if (result.success) {
        setAppointments(result.data)
      } else {
        console.error('Error fetching appointments:', result.error)
        setAppointments([])
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      setAppointments([])
    } finally {
      setIsLoading(false)
    }
  }, [currentDate])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  // Filter appointments by status
  const scheduledAppointments = useMemo(
    () => appointments.filter((apt) => apt.status === 'scheduled'),
    [appointments]
  )

  const completedAppointments = useMemo(
    () => appointments.filter((apt) => apt.status === 'completed'),
    [appointments]
  )

  const displayedAppointments = useMemo(
    () => (activeTab === 'pendientes' ? scheduledAppointments : completedAppointments),
    [activeTab, scheduledAppointments, completedAppointments]
  )

  // Navigation handlers
  const handlePrevDay = useCallback(() => {
    setCurrentDate((prev) => subDays(prev, 1))
  }, [])

  const handleNextDay = useCallback(() => {
    setCurrentDate((prev) => addDays(prev, 1))
  }, [])

  const handleGoToday = useCallback(() => {
    setCurrentDate(startOfDay(new Date()))
  }, [])

  // Appointment click handler
  const handleAppointmentClick = useCallback((appointment: AppointmentWithRelations) => {
    setSelectedAppointment(appointment)
    setPopupOpen(true)
  }, [])

  // Handle popup action complete - refresh appointments
  const handlePopupActionComplete = useCallback(() => {
    fetchAppointments()
  }, [fetchAppointments])

  return (
    <div className={cn('flex flex-col min-h-screen bg-background', className)}>
      {/* Header */}
      <MobileCalendarHeader
        displayName={user?.display_name || 'Usuario'}
        currentDate={currentDate}
        scheduledCount={scheduledAppointments.length}
        completedCount={completedAppointments.length}
        onPrevDay={handlePrevDay}
        onNextDay={handleNextDay}
        onGoToday={handleGoToday}
        isLoading={isLoading}
      />

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        scheduledCount={scheduledAppointments.length}
        completedCount={completedAppointments.length}
      />

      {/* Appointment list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
        <MobileAppointmentList
          appointments={displayedAppointments}
          isLoading={isLoading}
          onAppointmentClick={handleAppointmentClick}
          emptyStateMessage={
            activeTab === 'pendientes'
              ? 'No hay citas pendientes'
              : 'No hay citas completadas'
          }
        />
      </div>

      {/* FAB */}
      <FabButton onClick={onNewAppointment} />

      {/* Appointment Detail Popup */}
      <AppointmentPopup
        mode="dialog"
        appointment={selectedAppointment}
        open={popupOpen}
        onOpenChange={setPopupOpen}
        onEdit={onEditAppointment}
        onComplete={onCompleteAppointment}
        onActionComplete={handlePopupActionComplete}
      />
    </div>
  )
}
