# Product Specification: Email Appointment Reminders

**Feature:** Email Appointment Reminders
**GitHub Issue:** #3
**Repo:** quamidev/MidiMedV2
**Status:** Ready for Engineering Architect
**Date:** 2026-03-01

---

## Overall Product Goal

MidiMed's target users -- small clinic staff and doctors in Guatemala and Central America -- currently have no automated way to remind patients about upcoming appointments. Missed appointments waste provider time and hurt patient outcomes.

This feature introduces automated email reminders sent to patients at two intervals before their scheduled appointment: 24 hours and 2 hours. The system operates entirely in the background with zero manual intervention from clinic staff.

**Target Users:**
- **Patients** -- receive timely, branded reminders in Spanish so they show up on time
- **Clinic staff (Sofia persona)** -- freed from manually calling or messaging patients
- **Providers (Dr. Maria persona)** -- fewer no-shows means a fuller, more predictable schedule

**Expected Value:**
- Reduce appointment no-shows
- Eliminate manual reminder work for front-desk staff
- Reinforce professional, branded clinic communication

---

## Overall Acceptance Criteria

1. Patients receive an email reminder approximately 24 hours before a scheduled appointment.
2. Patients receive a second email reminder approximately 2 hours before the same appointment.
3. No patient receives duplicate reminders for the same appointment at the same interval (idempotent).
4. Reminders are only sent for appointments with status `scheduled` (not cancelled or completed).
5. Emails are written in Spanish, match MidiMed brand styling (teal #0d9488), and display: patient name, appointment date/time, doctor name, and clinic name.
6. The 24-hour and 2-hour reminder emails have distinct copy appropriate to the urgency of each interval.
7. Emails are responsive and render correctly across major email clients (Gmail, Outlook, Apple Mail).
8. The system runs automatically on a recurring schedule with no manual triggering required.
9. A patient whose appointment is created less than 24 hours but more than 2 hours before the scheduled time still receives the 2-hour reminder.
10. The feature operates within the Resend free tier limit of 3,000 emails/month without additional cost.

---

## User Flows

### Flow 1: Patient Receives 24-Hour Reminder

**Description:** A patient with a scheduled appointment receives an email reminder approximately 24 hours before the appointment time.

**Steps:**
1. Clinic staff or provider creates an appointment for a patient (existing functionality).
2. The patient record has an email address on file.
3. Approximately 24 hours before the appointment, the system automatically identifies this appointment as eligible for a 24-hour reminder.
4. The system checks that a 24-hour reminder has not already been sent for this appointment.
5. The system sends a branded email in Spanish to the patient's email address. The email contains:
   - Patient's name
   - Appointment date and time
   - Doctor's name
   - Clinic name
   - Friendly, informative copy indicating the appointment is tomorrow
6. The system records that the 24-hour reminder has been sent for this appointment.
7. The patient opens the email and sees a clean, branded reminder card.

**Edge Cases:**
- **Patient has no email address:** The system skips this appointment silently. No error is raised.
- **Appointment is cancelled before the reminder window:** The system only queries appointments with `scheduled` status, so cancelled appointments are excluded.
- **System was temporarily down and missed a window:** The query uses a 2-hour-wide window (now+23h to now+25h) so that if the hourly job misses one execution, the next run catches it.
- **Appointment created inside the 24h window:** If an appointment is created less than 24 hours out, the 24-hour reminder is simply never sent. The 2-hour reminder will still be sent if the appointment is more than ~1 hour away.

**Error States:**
- **Email delivery fails:** The system should not mark the reminder as sent if the email service returns an error. The next hourly run will retry.
- **Email service is entirely unavailable:** Same as above -- reminders remain unsent and are retried on the next run.

---

### Flow 2: Patient Receives 2-Hour Reminder

**Description:** A patient with a scheduled appointment receives an email reminder approximately 2 hours before the appointment time.

**Steps:**
1. An appointment exists in `scheduled` status.
2. Approximately 2 hours before the appointment, the system automatically identifies it as eligible for a 2-hour reminder.
3. The system checks that a 2-hour reminder has not already been sent for this appointment.
4. The system sends a branded email in Spanish to the patient's email address. The email contains:
   - Patient's name
   - Appointment date and time
   - Doctor's name
   - Clinic name
   - Slightly more urgent copy indicating the appointment is coming up soon
5. The system records that the 2-hour reminder has been sent for this appointment.

**Edge Cases:**
- **Patient has no email address:** Skipped silently.
- **Appointment was cancelled between the 24h and 2h window:** Not sent; only `scheduled` appointments are queried.
- **24-hour reminder was never sent (e.g., appointment was created 3 hours ago):** The 2-hour reminder is independent; it sends regardless of whether the 24-hour reminder was sent.

**Error States:**
- Same retry behavior as Flow 1. If the email service call fails, the flag is not set, and the next run retries.

---

### Flow 3: Appointment Cancelled After Reminder Sent

**Description:** A patient receives a 24-hour reminder, but the appointment is then cancelled before the 2-hour window.

**Steps:**
1. The 24-hour reminder is sent successfully.
2. The clinic staff or patient cancels the appointment (existing functionality sets status to `cancelled`).
3. When the system runs its 2-hour check, it queries only `scheduled` appointments.
4. The cancelled appointment is excluded. No 2-hour reminder is sent.

**Edge Cases:**
- **Appointment is cancelled after both reminders have been sent:** This is outside the scope of this feature. A future enhancement could send a cancellation notification email.

---

### Flow 4: Appointment Rescheduled

**Description:** An appointment's time is changed after a reminder has already been sent.

**Steps:**
1. The 24-hour reminder was sent for the original time.
2. The clinic staff reschedules the appointment to a new time.
3. If the rescheduled time falls into a future reminder window and the corresponding reminder flag is already marked as sent, no duplicate reminder is sent for the old time.

**Edge Cases:**
- **Rescheduling resets reminder eligibility:** This depends on whether the system resets the reminder flags when an appointment is rescheduled. **Recommended behavior:** When an appointment's `scheduled_start` is updated, the reminder boolean flags should be reset to `false` so that new reminders are sent for the updated time. This should be defined explicitly in the engineering spec.

**Note:** If resetting flags on reschedule is deemed out of scope for V1, this should be documented as a known limitation.

---

### Flow 5: Multi-Tenant Isolation

**Description:** The reminder system processes appointments across all tenants (clinics) without leaking data between them.

**Steps:**
1. The system queries all eligible appointments across all tenants.
2. Each email is sent using the patient and provider data belonging to that specific appointment's tenant.
3. The clinic name displayed in the email corresponds to the tenant's name.

**Edge Cases:**
- **A tenant has no appointments in the window:** Nothing happens for that tenant. No errors.
- **A tenant has many appointments in the window:** All are processed. If volume approaches the 3,000/month Resend limit, this is a capacity concern to monitor (see acceptance criteria #10).

---

## Flow-Specific Acceptance Criteria

### Flow 1: Patient Receives 24-Hour Reminder

1. An appointment scheduled for tomorrow at 10:00 AM triggers a 24-hour reminder email to the patient's email address when the system runs between 9:00 AM and 11:00 AM today.
2. The email subject and body are in Spanish.
3. The email displays the patient's full name, the appointment date and time, the provider's name, and the clinic name.
4. If the same system run executes twice (e.g., retry), only one email is sent per appointment.
5. Appointments without a patient email address are skipped without error.
6. Appointments with status `cancelled` or `completed` are excluded from the query.

### Flow 2: Patient Receives 2-Hour Reminder

1. An appointment scheduled for 3:00 PM today triggers a 2-hour reminder email when the system runs between 12:00 PM and 2:00 PM.
2. The 2-hour email has distinct copy from the 24-hour email, with more immediate language.
3. Sending the 2-hour reminder is independent of whether the 24-hour reminder was sent.
4. Duplicate 2-hour reminders are never sent for the same appointment.
5. Appointments without a patient email address are skipped without error.

### Flow 3: Appointment Cancelled After Reminder Sent

1. If an appointment is cancelled after the 24-hour reminder was sent, no 2-hour reminder is sent.
2. No cancellation notification email is sent (out of scope for V1).

### Flow 4: Appointment Rescheduled

1. If the appointment time changes, the system should ideally reset reminder flags so new reminders are sent for the updated time.
2. If flag reset on reschedule is out of scope for V1, this must be documented as a known limitation in the engineering spec.
3. Under no circumstances should a patient receive duplicate reminders for the same appointment at the same interval without a reschedule.

### Flow 5: Multi-Tenant Isolation

1. Each reminder email displays the correct clinic name for that appointment's tenant.
2. Patient and provider data from one tenant never appears in another tenant's reminder emails.
3. The system processes all tenants in a single scheduled run without requiring per-tenant configuration.

---

## Constraints and Considerations

- **Email Volume:** Resend free tier supports 3,000 emails/month. Two reminders per appointment means 1,500 appointments/month max. This is sufficient for the current user base but should be monitored.
- **Sender Address:** Emails are sent from `noreply@[domain]`. The domain must be verified with Resend.
- **Timezone:** Appointment times are stored in the database with timezone information. Reminder windows must be calculated in UTC to avoid timezone-related missed or duplicate sends.
- **No UI Changes:** This feature has no user-facing settings or dashboard. It is fully automatic. Future iterations could add a toggle for clinics to enable/disable reminders, or allow patients to unsubscribe.
- **Language:** All patient-facing email content is in Spanish (Latin American).

---

## Out of Scope (V1)

- Cancellation notification emails
- SMS reminders
- Patient unsubscribe/opt-out mechanism
- Clinic-level toggle to enable/disable reminders
- Custom reminder timing (e.g., clinic chooses 48h instead of 24h)
- Reminder delivery status visible in the MidiMed dashboard
- WhatsApp integration

---

## Handoff to Engineering Architect

This product specification is complete and ready for the engineering architect agent. The next step is to:

1. Design the technical architecture (scheduled function, database changes, email service integration)
2. Break this specification into implementation tickets
3. Define the technical approach for idempotency, error handling, and multi-tenant processing

All technical decisions -- including specific query patterns, function structure, error retry logic, and deployment configuration -- are the responsibility of the engineering architect.
