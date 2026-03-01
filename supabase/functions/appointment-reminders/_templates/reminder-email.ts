/**
 * Email template builder functions for appointment reminder emails.
 * Generates branded HTML email strings for 24-hour and 2-hour reminders.
 * Uses table-based layout with inline styles for email client compatibility.
 * All content is in Spanish (Latin American).
 *
 * Created: 2026-03-01 - PHASE-2-A Email Template Builder Functions
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReminderEmailData {
  patientFirstName: string
  appointmentDate: string // ISO 8601 string
  providerName: string
  clinicName: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BRAND_COLOR = "#0d9488"
const BRAND_COLOR_DARK = "#0b7e73"
const BACKGROUND_COLOR = "#f4f4f4"
const CARD_BACKGROUND = "#ffffff"
const TEXT_COLOR = "#333333"
const TEXT_MUTED = "#666666"
const FONT_FAMILY = "Arial, Helvetica, sans-serif"

// ---------------------------------------------------------------------------
// Subject line helpers
// ---------------------------------------------------------------------------

/** Returns the email subject line for the 24-hour reminder. */
export function get24hSubject(): string {
  return "Recordatorio: Tu cita es ma\u00f1ana"
}

/** Returns the email subject line for the 2-hour reminder. */
export function get2hSubject(): string {
  return "Recordatorio: Tu cita es en 2 horas"
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

/**
 * Formats an ISO 8601 date string into a human-readable Spanish string.
 * Example output: "lunes, 3 de marzo de 2026 a las 10:00 AM"
 *
 * Uses Intl.DateTimeFormat with the "es" locale. No external dependencies.
 */
function formatAppointmentDate(isoDate: string): string {
  const date = new Date(isoDate)

  const dayOfWeek = new Intl.DateTimeFormat("es", {
    weekday: "long",
  }).format(date)

  const dayNumber = date.getDate()

  const month = new Intl.DateTimeFormat("es", {
    month: "long",
  }).format(date)

  const year = date.getFullYear()

  const time = new Intl.DateTimeFormat("es", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date)

  // Capitalize AM/PM and normalize spacing
  const formattedTime = time
    .replace(/\s+/g, " ")
    .replace(/a\.\s?m\./i, "AM")
    .replace(/p\.\s?m\./i, "PM")
    .trim()

  return `${dayOfWeek}, ${dayNumber} de ${month} de ${year} a las ${formattedTime}`
}

// ---------------------------------------------------------------------------
// Shared email layout
// ---------------------------------------------------------------------------

/**
 * Builds the full HTML email document wrapping the provided body content.
 * Table-based layout, inline styles, 600px max-width, responsive.
 */
function buildEmailHtml(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recordatorio de Cita</title>
</head>
<body style="margin:0; padding:0; background-color:${BACKGROUND_COLOR}; font-family:${FONT_FAMILY}; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BACKGROUND_COLOR};">
    <tr>
      <td align="center" style="padding:20px 10px;">
        <!--[if mso]>
        <table width="600" cellpadding="0" cellspacing="0" border="0">
        <tr>
        <td>
        <![endif]-->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background-color:${CARD_BACKGROUND}; border-radius:8px; overflow:hidden;">
${bodyContent}
        </table>
        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Builds the branded header row with the MidiMed name.
 */
function buildHeader(): string {
  return `
          <!-- Header -->
          <tr>
            <td align="center" style="background-color:${BRAND_COLOR}; padding:30px 20px;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="font-family:${FONT_FAMILY}; font-size:28px; font-weight:bold; color:#ffffff; letter-spacing:1px;">
                    MidiMed
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
}

/**
 * Builds the greeting and main message rows.
 */
function buildGreetingAndMessage(
  patientFirstName: string,
  message: string
): string {
  return `
          <!-- Greeting -->
          <tr>
            <td style="padding:30px 30px 10px 30px; font-family:${FONT_FAMILY}; font-size:20px; font-weight:bold; color:${TEXT_COLOR};">
              Hola, ${escapeHtml(patientFirstName)}
            </td>
          </tr>
          <!-- Message -->
          <tr>
            <td style="padding:10px 30px 20px 30px; font-family:${FONT_FAMILY}; font-size:16px; line-height:24px; color:${TEXT_COLOR};">
              ${message}
            </td>
          </tr>`
}

/**
 * Builds the appointment details card with date, provider, and clinic.
 */
function buildAppointmentCard(
  formattedDate: string,
  providerName: string,
  clinicName: string
): string {
  return `
          <!-- Appointment Details Card -->
          <tr>
            <td style="padding:0 30px 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9fafb; border-radius:8px; border-left:4px solid ${BRAND_COLOR};">
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <!-- Date/Time -->
                      <tr>
                        <td style="padding-bottom:12px;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family:${FONT_FAMILY}; font-size:13px; font-weight:bold; color:${TEXT_MUTED}; text-transform:uppercase; letter-spacing:0.5px;">
                                Fecha y hora
                              </td>
                            </tr>
                            <tr>
                              <td style="font-family:${FONT_FAMILY}; font-size:16px; color:${TEXT_COLOR}; padding-top:4px;">
                                ${escapeHtml(formattedDate)}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <!-- Provider -->
                      <tr>
                        <td style="padding-bottom:12px;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family:${FONT_FAMILY}; font-size:13px; font-weight:bold; color:${TEXT_MUTED}; text-transform:uppercase; letter-spacing:0.5px;">
                                Doctor(a)
                              </td>
                            </tr>
                            <tr>
                              <td style="font-family:${FONT_FAMILY}; font-size:16px; color:${TEXT_COLOR}; padding-top:4px;">
                                ${escapeHtml(providerName)}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <!-- Clinic -->
                      <tr>
                        <td>
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family:${FONT_FAMILY}; font-size:13px; font-weight:bold; color:${TEXT_MUTED}; text-transform:uppercase; letter-spacing:0.5px;">
                                Cl\u00ednica
                              </td>
                            </tr>
                            <tr>
                              <td style="font-family:${FONT_FAMILY}; font-size:16px; color:${TEXT_COLOR}; padding-top:4px;">
                                ${escapeHtml(clinicName)}
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
}

/**
 * Builds the footer row with a closing message and clinic name.
 */
function buildFooter(clinicName: string): string {
  return `
          <!-- Footer -->
          <tr>
            <td style="padding:20px 30px; border-top:1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:${FONT_FAMILY}; font-size:14px; line-height:20px; color:${TEXT_MUTED};">
                    Si necesita cambiar o cancelar su cita, por favor comun\u00edquese con la cl\u00ednica directamente.
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px; font-family:${FONT_FAMILY}; font-size:13px; color:${TEXT_MUTED};">
                    ${escapeHtml(clinicName)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Brand Footer Bar -->
          <tr>
            <td style="background-color:${BRAND_COLOR_DARK}; padding:12px 30px; text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="font-family:${FONT_FAMILY}; font-size:12px; color:#ffffff;">
                    Enviado por MidiMed
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
}

// ---------------------------------------------------------------------------
// HTML escaping utility
// ---------------------------------------------------------------------------

/**
 * Escapes HTML special characters to prevent injection in template literals.
 * Handles the five key characters: &, <, >, ", and '.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

// ---------------------------------------------------------------------------
// Public email builder functions
// ---------------------------------------------------------------------------

/**
 * Builds the complete HTML email string for the 24-hour appointment reminder.
 * Uses a calm, informative tone.
 *
 * @param data - Patient, appointment, provider, and clinic information.
 * @returns A complete HTML document string ready to send via email.
 */
export function build24hReminderEmail(data: ReminderEmailData): string {
  const formattedDate = formatAppointmentDate(data.appointmentDate)

  const message =
    "Le recordamos que tiene una cita programada para ma\u00f1ana. " +
    "A continuaci\u00f3n encontrar\u00e1 los detalles de su cita:"

  const bodyContent = [
    buildHeader(),
    buildGreetingAndMessage(data.patientFirstName, message),
    buildAppointmentCard(formattedDate, data.providerName, data.clinicName),
    buildFooter(data.clinicName),
  ].join("")

  return buildEmailHtml(bodyContent)
}

/**
 * Builds the complete HTML email string for the 2-hour appointment reminder.
 * Uses a more urgent tone than the 24-hour version.
 *
 * @param data - Patient, appointment, provider, and clinic information.
 * @returns A complete HTML document string ready to send via email.
 */
export function build2hReminderEmail(data: ReminderEmailData): string {
  const formattedDate = formatAppointmentDate(data.appointmentDate)

  const message =
    "Su cita es en aproximadamente 2 horas. " +
    "Por favor aseg\u00farese de llegar a tiempo. " +
    "Aqu\u00ed est\u00e1n los detalles:"

  const bodyContent = [
    buildHeader(),
    buildGreetingAndMessage(data.patientFirstName, message),
    buildAppointmentCard(formattedDate, data.providerName, data.clinicName),
    buildFooter(data.clinicName),
  ].join("")

  return buildEmailHtml(bodyContent)
}
