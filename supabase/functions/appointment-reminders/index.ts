/**
 * Supabase Edge Function: appointment-reminders
 *
 * Queries appointments eligible for 24-hour and 2-hour email reminders,
 * sends branded HTML emails via the Resend API, and updates idempotency
 * flags on the appointments table. Designed to be invoked hourly by pg_cron.
 *
 * Created: 2026-03-01 - PHASE-3-A Edge Function -- Core Reminder Logic
 */

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  build24hReminderEmail,
  build2hReminderEmail,
  get24hSubject,
  get2hSubject,
  type ReminderEmailData,
} from './_templates/reminder-email.ts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReminderEligibleAppointment {
  id: string
  tenant_id: string
  scheduled_start: string
  patient_first_name: string
  patient_last_name: string
  patient_email: string
  provider_name: string
  clinic_name: string
  needs_24h: boolean
  needs_2h: boolean
}

interface ReminderRunResult {
  total_eligible: number
  sent_24h: number
  sent_2h: number
  errors: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RESEND_API_URL = 'https://api.resend.com/emails'
const SENDER_ADDRESS = 'MidiMed <noreply@midimed.app>'
const MS_PER_HOUR = 60 * 60 * 1000

// ---------------------------------------------------------------------------
// Supabase client (service role -- bypasses RLS for cross-tenant processing)
// ---------------------------------------------------------------------------

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ---------------------------------------------------------------------------
// Database: fetch eligible appointments
// ---------------------------------------------------------------------------

/**
 * Fetches all appointments eligible for either a 24-hour or 2-hour reminder
 * in a single query. Joins appointments with patients, users (provider), and
 * tenants to gather all data needed for the email template.
 *
 * Uses the Supabase query builder with PostgREST relationship joins. The
 * boolean flags `needs_24h` and `needs_2h` are computed in application code
 * from the raw column values and time window boundaries.
 */
async function fetchEligibleAppointments(
  client: SupabaseClient
): Promise<ReminderEligibleAppointment[]> {
  const now = new Date()
  const plus1h = new Date(now.getTime() + 1 * MS_PER_HOUR).toISOString()
  const plus3h = new Date(now.getTime() + 3 * MS_PER_HOUR).toISOString()
  const plus23h = new Date(now.getTime() + 23 * MS_PER_HOUR).toISOString()
  const plus25h = new Date(now.getTime() + 25 * MS_PER_HOUR).toISOString()

  // Single query: fetch appointments in EITHER the 24h or 2h window.
  // The `.or()` filter uses PostgREST syntax to combine both window conditions.
  // `patients!inner` ensures only appointments with a matching patient row are
  // returned. The email null check is enforced via `.neq()` on the relation.
  const { data, error } = await client
    .from('appointments')
    .select(`
      id,
      tenant_id,
      scheduled_start,
      reminder_24h_sent,
      reminder_2h_sent,
      patients!inner ( first_name, last_name, email ),
      provider:users!appointments_provider_id_fkey ( display_name ),
      tenants!inner ( name )
    `)
    .eq('status', 'scheduled')
    .not('patients.email', 'is', null)
    .or(
      `and(reminder_24h_sent.eq.false,scheduled_start.gte.${plus23h},scheduled_start.lte.${plus25h}),` +
      `and(reminder_2h_sent.eq.false,scheduled_start.gte.${plus1h},scheduled_start.lte.${plus3h})`
    )

  if (error) {
    throw new Error(`Failed to query eligible appointments: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return []
  }

  // Map the nested PostgREST response to the flat ReminderEligibleAppointment
  // interface. Compute needs_24h / needs_2h from the raw boolean flags and
  // the time window boundaries.
  const plus1hMs = new Date(plus1h).getTime()
  const plus3hMs = new Date(plus3h).getTime()
  const plus23hMs = new Date(plus23h).getTime()
  const plus25hMs = new Date(plus25h).getTime()

  const appointments: ReminderEligibleAppointment[] = data.map(
    (row: Record<string, unknown>) => {
      const patient = row.patients as Record<string, string>
      const provider = row.provider as Record<string, string>
      const tenant = row.tenants as Record<string, string>
      const scheduledStart = row.scheduled_start as string
      const reminder24hSent = row.reminder_24h_sent as boolean
      const reminder2hSent = row.reminder_2h_sent as boolean
      const startMs = new Date(scheduledStart).getTime()

      return {
        id: row.id as string,
        tenant_id: row.tenant_id as string,
        scheduled_start: scheduledStart,
        patient_first_name: patient.first_name,
        patient_last_name: patient.last_name,
        patient_email: patient.email,
        provider_name: provider.display_name,
        clinic_name: tenant.name,
        needs_24h:
          !reminder24hSent && startMs >= plus23hMs && startMs <= plus25hMs,
        needs_2h:
          !reminder2hSent && startMs >= plus1hMs && startMs <= plus3hMs,
      }
    }
  )

  return appointments
}

// ---------------------------------------------------------------------------
// Resend: send a single email
// ---------------------------------------------------------------------------

/**
 * Sends a reminder email for a single appointment via the Resend API.
 * Returns `true` if the API responded with HTTP 200 or 201, `false` otherwise.
 */
async function sendReminder(
  appointment: ReminderEligibleAppointment,
  type: '24h' | '2h'
): Promise<boolean> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  if (!resendApiKey) {
    console.error('[appointment-reminders] RESEND_API_KEY is not set')
    return false
  }

  const emailData: ReminderEmailData = {
    patientFirstName: appointment.patient_first_name,
    appointmentDate: appointment.scheduled_start,
    providerName: appointment.provider_name,
    clinicName: appointment.clinic_name,
  }

  const subject = type === '24h' ? get24hSubject() : get2hSubject()
  const htmlContent =
    type === '24h'
      ? build24hReminderEmail(emailData)
      : build2hReminderEmail(emailData)

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: SENDER_ADDRESS,
      to: [appointment.patient_email],
      subject,
      html: htmlContent,
    }),
  })

  if (response.ok) {
    return true
  }

  const errorBody = await response.text()
  console.error(
    `[appointment-reminders] Resend API error for appointment ${appointment.id} (${type}): ` +
      `status=${response.status} body=${errorBody}`
  )
  return false
}

// ---------------------------------------------------------------------------
// Database: mark a reminder as sent
// ---------------------------------------------------------------------------

/**
 * Updates the idempotency flag on a single appointment after a successful
 * email send. Only sets the flag for the specified reminder type.
 */
async function markReminderSent(
  client: SupabaseClient,
  appointmentId: string,
  type: '24h' | '2h'
): Promise<void> {
  const column = type === '24h' ? 'reminder_24h_sent' : 'reminder_2h_sent'

  const { error } = await client
    .from('appointments')
    .update({ [column]: true })
    .eq('id', appointmentId)

  if (error) {
    console.error(
      `[appointment-reminders] Failed to update ${column} for appointment ${appointmentId}: ${error.message}`
    )
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request): Promise<Response> => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const startTime = Date.now()

  const result: ReminderRunResult = {
    total_eligible: 0,
    sent_24h: 0,
    sent_2h: 0,
    errors: 0,
  }

  try {
    // Step 1: Fetch all eligible appointments
    const appointments = await fetchEligibleAppointments(supabase)
    result.total_eligible = appointments.length

    if (appointments.length === 0) {
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Step 2: Process each appointment sequentially (respects Resend rate limits)
    for (const appointment of appointments) {
      // Handle 24h reminder
      if (appointment.needs_24h) {
        try {
          const sent = await sendReminder(appointment, '24h')
          if (sent) {
            await markReminderSent(supabase, appointment.id, '24h')
            result.sent_24h++
          } else {
            result.errors++
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          console.error(
            `[appointment-reminders] Error sending 24h reminder for appointment ${appointment.id}: ${message}`
          )
          result.errors++
        }
      }

      // Handle 2h reminder (independent of 24h -- same appointment can need both)
      if (appointment.needs_2h) {
        try {
          const sent = await sendReminder(appointment, '2h')
          if (sent) {
            await markReminderSent(supabase, appointment.id, '2h')
            result.sent_2h++
          } else {
            result.errors++
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          console.error(
            `[appointment-reminders] Error sending 2h reminder for appointment ${appointment.id}: ${message}`
          )
          result.errors++
        }
      }
    }

    // Log a warning if the run took longer than 30 seconds
    const elapsed = Date.now() - startTime
    if (elapsed > 30_000) {
      console.error(
        `[appointment-reminders] Warning: run took ${elapsed}ms (${appointments.length} appointments)`
      )
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[appointment-reminders] Fatal error: ${message}`)

    return new Response(
      JSON.stringify({ error: message, ...result }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
