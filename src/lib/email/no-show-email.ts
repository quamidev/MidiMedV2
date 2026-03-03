/**
 * No-Show Email Template Builder
 *
 * Generates HTML and plain-text email content for no-show appointment notifications.
 * Used by the markNoShow server action when the user opts to notify the patient.
 *
 * Created: 2026-03-02 - AO-003 No-show notification email
 */

interface NoShowEmailParams {
  patientName: string
  appointmentDate: string
  appointmentTime: string
  clinicName: string
}

export function buildNoShowEmailHtml(params: NoShowEmailParams): string {
  const { patientName, appointmentDate, appointmentTime, clinicName } = params

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Cita No Atendida</h1>
  </div>

  <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="margin-top: 0;">Hola <strong>${patientName}</strong>,</p>

    <p>Notamos que no pudiste asistir a tu cita programada:</p>

    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0;"><strong>Fecha:</strong> ${appointmentDate}</p>
      <p style="margin: 5px 0 0 0;"><strong>Hora:</strong> ${appointmentTime}</p>
    </div>

    <p>Si deseas reprogramar tu cita, por favor comunícate con nosotros a la brevedad posible.</p>

    <p style="margin-bottom: 0;">Atentamente,<br><strong>${clinicName}</strong></p>
  </div>

  <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
    Este mensaje fue enviado automáticamente por MidiMed.
  </p>
</body>
</html>
  `.trim()
}

export function buildNoShowEmailText(params: NoShowEmailParams): string {
  const { patientName, appointmentDate, appointmentTime, clinicName } = params

  return `
Hola ${patientName},

Notamos que no pudiste asistir a tu cita programada:

Fecha: ${appointmentDate}
Hora: ${appointmentTime}

Si deseas reprogramar tu cita, por favor comunícate con nosotros a la brevedad posible.

Atentamente,
${clinicName}

---
Este mensaje fue enviado automáticamente por MidiMed.
  `.trim()
}
