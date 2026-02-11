/**
 * AppointmentCalendar - Main calendar component for viewing appointments
 *
 * Features:
 * - Month/Week/Day views with custom toolbar
 * - react-big-calendar with date-fns localizer (Spanish)
 * - Provider color-coding from user.color
 * - Cancelled appointments: 50% opacity, grayscale
 * - Mobile defaults to Day view
 * - Loading skeleton while data fetches
 * - Event click opens appointment detail popup
 * - Custom styled to match MidiMed design system
 * - Drag and drop to reschedule appointments
 * - Resize events to change duration
 *
 * Created: 2026-02-10 - MV2-022 Calendar Component
 * Updated: 2026-02-10 - MV2-024 Integrated appointment detail popup
 * Updated: 2026-02-10 - MV2-025 Added drag and drop with reschedule confirmation
 */

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  type View,
  type SlotInfo,
} from 'react-big-calendar'
import withDragAndDrop, {
  type EventInteractionArgs,
} from 'react-big-calendar/lib/addons/dragAndDrop'
import {
  format,
  parse,
  startOfWeek,
  getDay,
  startOfMonth,
  endOfMonth,
  startOfWeek as getWeekStart,
  endOfWeek as getWeekEnd,
} from 'date-fns'
import { es } from 'date-fns/locale'

import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'

import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { getAppointments } from '@/actions/appointments'
import type { AppointmentWithRelations } from '@/types/app'

import { CalendarToolbar } from './calendar-toolbar'
import { CalendarEvent, CalendarAgendaEvent, type CalendarEventData } from './calendar-event'
import { AppointmentPopup } from './appointment-popup'
import { RescheduleDialog, type RescheduleInfo } from './reschedule-dialog'

// =============================================================================
// Date-fns Localizer Configuration
// =============================================================================

const locales = {
  es: es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: es, weekStartsOn: 1 }),
  getDay,
  locales,
})

// Spanish messages for react-big-calendar
const messages = {
  allDay: 'Todo el día',
  previous: 'Anterior',
  next: 'Siguiente',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'No hay citas en este rango.',
  showMore: (total: number) => `+ ${total} más`,
}

// =============================================================================
// Drag and Drop Calendar Setup
// =============================================================================

const DragAndDropCalendar = withDragAndDrop<CalendarEventData>(BigCalendar)

// =============================================================================
// Types
// =============================================================================

interface AppointmentCalendarProps {
  className?: string
  onEventClick?: (appointment: AppointmentWithRelations) => void
  onSlotSelect?: (slotInfo: SlotInfo) => void
  onEditAppointment?: (appointment: AppointmentWithRelations) => void
  onCompleteAppointment?: (appointment: AppointmentWithRelations) => void
  initialDate?: Date
  initialView?: View
}

// =============================================================================
// Loading Skeleton Component
// =============================================================================

function CalendarSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Calendar grid skeleton */}
      <div className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
        {/* Day headers */}
        <div className="mb-2 grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={`header-${i}`} className="h-8 rounded" />
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton
              key={`cell-${i}`}
              className={cn('h-20 rounded-lg', i % 7 >= 5 && 'opacity-50')}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Main Calendar Component
// =============================================================================

export function AppointmentCalendar({
  className,
  onEventClick,
  onSlotSelect,
  onEditAppointment,
  onCompleteAppointment,
  initialDate,
  initialView,
}: AppointmentCalendarProps) {
  // State
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState<Date>(initialDate || new Date())
  const [view, setView] = useState<View>(initialView || 'month')
  const [isMobile, setIsMobile] = useState(false)

  // Popup state
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null)
  const [popupOpen, setPopupOpen] = useState(false)

  // Reschedule dialog state
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [rescheduleInfo, setRescheduleInfo] = useState<RescheduleInfo | null>(null)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      // Set default view to day on mobile if no initial view specified
      if (mobile && !initialView) {
        setView('day')
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [initialView])

  // Calculate date range based on view
  const dateRange = useMemo(() => {
    if (view === 'month') {
      // Get start of month and extend to include full weeks
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)
      return {
        start: getWeekStart(monthStart, { locale: es, weekStartsOn: 1 }),
        end: getWeekEnd(monthEnd, { locale: es, weekStartsOn: 1 }),
      }
    }
    if (view === 'week') {
      return {
        start: getWeekStart(currentDate, { locale: es, weekStartsOn: 1 }),
        end: getWeekEnd(currentDate, { locale: es, weekStartsOn: 1 }),
      }
    }
    // Day view
    return {
      start: currentDate,
      end: currentDate,
    }
  }, [currentDate, view])

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getAppointments({
        startDate: format(dateRange.start, 'yyyy-MM-dd'),
        endDate: format(dateRange.end, 'yyyy-MM-dd'),
      })

      if (result.success) {
        setAppointments(result.data)
      } else {
        setError(result.error)
        setAppointments([])
      }
    } catch (err) {
      console.error('Error fetching appointments:', err)
      setError('Error al cargar las citas')
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  // Transform appointments to calendar events
  const events: CalendarEventData[] = useMemo(() => {
    return appointments.map((apt) => ({
      id: apt.id,
      title: apt.patient_name,
      start: new Date(apt.scheduled_start),
      end: new Date(apt.scheduled_end),
      resource: apt,
    }))
  }, [appointments])

  // Event handlers
  const handleNavigate = useCallback((newDate: Date) => {
    setCurrentDate(newDate)
  }, [])

  const handleViewChange = useCallback((newView: View) => {
    setView(newView)
  }, [])

  const handleSelectEvent = useCallback(
    (event: CalendarEventData) => {
      // Open the popup with the selected appointment
      setSelectedAppointment(event.resource)
      setPopupOpen(true)

      // Also call the external callback if provided
      if (onEventClick) {
        onEventClick(event.resource)
      }
    },
    [onEventClick]
  )

  // Handle popup action complete - refresh appointments
  const handlePopupActionComplete = useCallback(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const handleSelectSlot = useCallback(
    (slotInfo: SlotInfo) => {
      if (onSlotSelect) {
        onSlotSelect(slotInfo)
      }
    },
    [onSlotSelect]
  )

  // =============================================================================
  // Drag and Drop Handlers
  // =============================================================================

  // Determine if an event can be dragged (only scheduled appointments)
  const draggableAccessor = useCallback((event: CalendarEventData) => {
    return event.resource.status === 'scheduled'
  }, [])

  // Determine if an event can be resized (only scheduled appointments)
  const resizableAccessor = useCallback((event: CalendarEventData) => {
    return event.resource.status === 'scheduled'
  }, [])

  // Handle event drop (move to new time)
  const handleEventDrop = useCallback(
    (args: EventInteractionArgs<CalendarEventData>) => {
      const { event, start, end } = args
      const appointment = event.resource

      // Only allow dragging scheduled appointments
      if (appointment.status !== 'scheduled') {
        return
      }

      // Prepare reschedule info for dialog
      setRescheduleInfo({
        appointment,
        oldStart: new Date(appointment.scheduled_start),
        oldEnd: new Date(appointment.scheduled_end),
        newStart: start instanceof Date ? start : new Date(start),
        newEnd: end instanceof Date ? end : new Date(end),
        isResize: false,
      })
      setRescheduleDialogOpen(true)
    },
    []
  )

  // Handle event resize (change duration)
  const handleEventResize = useCallback(
    (args: EventInteractionArgs<CalendarEventData>) => {
      const { event, start, end } = args
      const appointment = event.resource

      // Only allow resizing scheduled appointments
      if (appointment.status !== 'scheduled') {
        return
      }

      // Prepare reschedule info for dialog
      setRescheduleInfo({
        appointment,
        oldStart: new Date(appointment.scheduled_start),
        oldEnd: new Date(appointment.scheduled_end),
        newStart: start instanceof Date ? start : new Date(start),
        newEnd: end instanceof Date ? end : new Date(end),
        isResize: true,
      })
      setRescheduleDialogOpen(true)
    },
    []
  )

  // Handle reschedule confirmation
  const handleRescheduleConfirm = useCallback(() => {
    setRescheduleDialogOpen(false)
    setRescheduleInfo(null)
    // Refresh appointments to show updated data
    fetchAppointments()
  }, [fetchAppointments])

  // Handle reschedule cancel (revert to original position)
  const handleRescheduleCancel = useCallback(() => {
    setRescheduleDialogOpen(false)
    setRescheduleInfo(null)
    // No need to refresh - the calendar will revert automatically since we didn't change state
  }, [])

  // Handle dialog close
  const handleRescheduleClose = useCallback(() => {
    // Treat close as cancel
    handleRescheduleCancel()
  }, [handleRescheduleCancel])

  // Event style getter
  const eventStyleGetter = useCallback((event: CalendarEventData) => {
    const apt = event.resource
    const isCancelled = apt.status === 'cancelled'

    return {
      style: {
        backgroundColor: 'transparent',
        border: 'none',
        padding: 0,
        filter: isCancelled ? 'grayscale(1)' : undefined,
        opacity: isCancelled ? 0.5 : 1,
      },
    }
  }, [])

  // Day style getter - highlight today
  const dayPropGetter = useCallback((date: Date) => {
    const today = new Date()
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()

    if (isToday) {
      return {
        className: 'rbc-today-cell',
        style: {
          backgroundColor: 'color-mix(in oklch, var(--primary) 8%, transparent)',
        },
      }
    }
    return {}
  }, [])

  // Custom components
  const components = useMemo(
    () => ({
      toolbar: CalendarToolbar,
      event: CalendarEvent,
      agenda: {
        event: CalendarAgendaEvent,
      },
    }),
    []
  )

  // Slot step and time range
  const minTime = useMemo(() => {
    const d = new Date()
    d.setHours(7, 0, 0, 0)
    return d
  }, [])

  const maxTime = useMemo(() => {
    const d = new Date()
    d.setHours(20, 0, 0, 0)
    return d
  }, [])

  if (loading) {
    return (
      <div className={cn('w-full', className)}>
        <CalendarSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div
        className={cn(
          'flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-border/50 bg-card p-8 text-center shadow-sm',
          className
        )}
      >
        <p className="text-muted-foreground">{error}</p>
        <button
          type="button"
          onClick={fetchAppointments}
          className="mt-4 text-sm font-medium text-primary hover:underline"
        >
          Intentar de nuevo
        </button>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'calendar-container rounded-xl border border-border/50 bg-card shadow-sm',
          'overflow-hidden'
        )}
      >
        <DragAndDropCalendar
          localizer={localizer}
          events={events}
          view={view}
          date={currentDate}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          draggableAccessor={draggableAccessor}
          resizableAccessor={resizableAccessor}
          resizable
          selectable
          popup
          messages={messages}
          components={components}
          eventPropGetter={eventStyleGetter}
          dayPropGetter={dayPropGetter}
          min={minTime}
          max={maxTime}
          step={30}
          timeslots={2}
          formats={{
            timeGutterFormat: (date: Date) => format(date, 'HH:mm', { locale: es }),
            eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
              `${format(start, 'HH:mm', { locale: es })} - ${format(end, 'HH:mm', { locale: es })}`,
            dayFormat: (date: Date) => format(date, 'EEE d', { locale: es }),
            dayHeaderFormat: (date: Date) => format(date, "EEEE, d 'de' MMMM", { locale: es }),
            dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
              `${format(start, "d 'de' MMMM", { locale: es })} - ${format(end, "d 'de' MMMM yyyy", { locale: es })}`,
            monthHeaderFormat: (date: Date) => format(date, 'MMMM yyyy', { locale: es }),
            weekdayFormat: (date: Date) => format(date, 'EEEE', { locale: es }),
          }}
          style={{
            height: isMobile ? 'calc(100vh - 200px)' : '600px',
            minHeight: isMobile ? '400px' : '600px',
          }}
        />
      </div>

      {/* Custom calendar styles */}
      <style jsx global>{`
        /* Base calendar container */
        .calendar-container .rbc-calendar {
          font-family: inherit;
          padding: 1rem;
        }

        /* Header row */
        .calendar-container .rbc-header {
          padding: 0.75rem 0.5rem;
          font-weight: 500;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--muted-foreground);
          border-bottom: 1px solid var(--border);
          background: var(--background);
        }

        .calendar-container .rbc-header + .rbc-header {
          border-left: 1px solid var(--border);
        }

        /* Month view cells */
        .calendar-container .rbc-month-view {
          border: none;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .calendar-container .rbc-month-row {
          border-bottom: 1px solid var(--border);
        }

        .calendar-container .rbc-month-row:last-child {
          border-bottom: none;
        }

        .calendar-container .rbc-day-bg {
          background: var(--card);
          transition: background-color 0.2s ease;
        }

        .calendar-container .rbc-day-bg:hover {
          background: color-mix(in oklch, var(--accent) 50%, var(--card));
        }

        .calendar-container .rbc-day-bg + .rbc-day-bg {
          border-left: 1px solid var(--border);
        }

        .calendar-container .rbc-off-range-bg {
          background: color-mix(in oklch, var(--muted) 30%, var(--card));
        }

        .calendar-container .rbc-today {
          background: color-mix(in oklch, var(--primary) 8%, var(--card)) !important;
        }

        /* Date cell headers in month view */
        .calendar-container .rbc-date-cell {
          padding: 0.5rem;
          text-align: right;
        }

        .calendar-container .rbc-date-cell > a {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--foreground);
          text-decoration: none;
        }

        .calendar-container .rbc-date-cell.rbc-now > a {
          color: var(--primary);
          font-weight: 600;
        }

        .calendar-container .rbc-off-range > a {
          color: var(--muted-foreground);
          opacity: 0.5;
        }

        /* Event rows */
        .calendar-container .rbc-row-segment {
          padding: 0 2px 2px 2px;
        }

        .calendar-container .rbc-event {
          background: transparent !important;
          border: none !important;
          border-radius: 0.375rem;
          padding: 0;
          margin: 1px 0;
        }

        .calendar-container .rbc-event:focus {
          outline: 2px solid var(--ring);
          outline-offset: 2px;
        }

        .calendar-container .rbc-event-content {
          overflow: visible;
        }

        .calendar-container .rbc-show-more {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--primary);
          background: transparent;
          padding: 0.25rem 0.5rem;
          margin-left: 2px;
        }

        .calendar-container .rbc-show-more:hover {
          text-decoration: underline;
        }

        /* Week/Day view */
        .calendar-container .rbc-time-view {
          border: none;
          border-radius: 0.5rem;
          overflow: hidden;
        }

        .calendar-container .rbc-time-header {
          border-bottom: 1px solid var(--border);
        }

        .calendar-container .rbc-time-header-content {
          border-left: 1px solid var(--border);
        }

        .calendar-container .rbc-time-gutter {
          background: var(--background);
        }

        .calendar-container .rbc-time-content {
          border-top: none;
        }

        .calendar-container .rbc-time-column {
          background: var(--card);
        }

        .calendar-container .rbc-timeslot-group {
          border-bottom: 1px solid color-mix(in oklch, var(--border) 50%, transparent);
          min-height: 40px;
        }

        .calendar-container .rbc-time-slot {
          border-top: none;
        }

        .calendar-container .rbc-label {
          font-size: 0.75rem;
          color: var(--muted-foreground);
          padding: 0.5rem;
        }

        .calendar-container .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid color-mix(in oklch, var(--border) 30%, transparent);
        }

        .calendar-container .rbc-day-slot .rbc-events-container {
          margin-right: 4px;
        }

        /* Current time indicator */
        .calendar-container .rbc-current-time-indicator {
          background-color: var(--primary);
          height: 2px;
        }

        .calendar-container .rbc-current-time-indicator::before {
          content: '';
          position: absolute;
          left: -6px;
          top: -4px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: var(--primary);
        }

        /* All day events */
        .calendar-container .rbc-allday-cell {
          background: var(--background);
        }

        /* Agenda view */
        .calendar-container .rbc-agenda-view {
          border: none;
        }

        .calendar-container .rbc-agenda-table {
          border: none;
        }

        .calendar-container .rbc-agenda-table thead {
          display: none;
        }

        .calendar-container .rbc-agenda-table td {
          padding: 0.75rem;
          border-bottom: 1px solid var(--border);
        }

        .calendar-container .rbc-agenda-date-cell {
          font-weight: 500;
          color: var(--foreground);
          white-space: nowrap;
        }

        .calendar-container .rbc-agenda-time-cell {
          color: var(--muted-foreground);
          font-size: 0.875rem;
        }

        .calendar-container .rbc-agenda-event-cell {
          width: 100%;
        }

        /* Empty message */
        .calendar-container .rbc-agenda-empty {
          padding: 2rem;
          text-align: center;
          color: var(--muted-foreground);
        }

        /* Overlay popup */
        .calendar-container .rbc-overlay {
          background: var(--popover);
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          padding: 0.5rem;
          max-height: 300px;
          overflow-y: auto;
        }

        .calendar-container .rbc-overlay-header {
          font-weight: 600;
          font-size: 0.875rem;
          padding: 0.5rem;
          border-bottom: 1px solid var(--border);
          margin-bottom: 0.5rem;
          color: var(--foreground);
        }

        /* Selected slot */
        .calendar-container .rbc-slot-selection {
          background: color-mix(in oklch, var(--primary) 20%, transparent);
          border: 2px dashed var(--primary);
          border-radius: 0.25rem;
        }

        /* Drag and drop addon styles */
        .calendar-container .rbc-addons-dnd .rbc-event {
          transition: opacity 0.15s ease;
        }

        .calendar-container .rbc-addons-dnd-is-dragging .rbc-event:not(.rbc-addons-dnd-dragged-event) {
          opacity: 0.5;
        }

        .calendar-container .rbc-addons-dnd-dragged-event {
          opacity: 0.8;
          z-index: 100;
        }

        .calendar-container .rbc-addons-dnd-drag-preview {
          background: color-mix(in oklch, var(--primary) 15%, var(--card));
          border: 2px dashed var(--primary);
          border-radius: 0.375rem;
          opacity: 0.9;
        }

        .calendar-container .rbc-addons-dnd-over {
          background: color-mix(in oklch, var(--primary) 10%, var(--card));
        }

        /* Resize handles */
        .calendar-container .rbc-addons-dnd-resize-ns-anchor {
          height: 10px;
          cursor: ns-resize;
        }

        .calendar-container .rbc-addons-dnd-resize-ns-anchor:first-child {
          top: 0;
        }

        .calendar-container .rbc-addons-dnd-resize-ns-anchor:last-child {
          bottom: 0;
        }

        .calendar-container .rbc-addons-dnd-resize-ns-anchor .rbc-addons-dnd-resize-ns-icon {
          display: none;
        }

        .calendar-container .rbc-event:hover .rbc-addons-dnd-resize-ns-anchor {
          background: color-mix(in oklch, var(--primary) 30%, transparent);
        }

        /* Dark mode adjustments */
        .dark .calendar-container .rbc-off-range-bg {
          background: color-mix(in oklch, var(--muted) 15%, var(--card));
        }

        .dark .calendar-container .rbc-today {
          background: color-mix(in oklch, var(--primary) 12%, var(--card)) !important;
        }
      `}</style>

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

      {/* Reschedule Confirmation Dialog */}
      <RescheduleDialog
        open={rescheduleDialogOpen}
        onClose={handleRescheduleClose}
        onConfirm={handleRescheduleConfirm}
        onCancel={handleRescheduleCancel}
        rescheduleInfo={rescheduleInfo}
      />
    </div>
  )
}
