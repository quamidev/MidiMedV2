# Product Specification: AI Dictation for Medical Records

**Feature:** AI Dictation Interpretation for Medical Records
**GitHub Issue:** #1
**Repo:** quamidev/MidiMedV2
**Date:** 2026-02-28
**Status:** Ready for Engineering Architect

---

## 1. Overall Product Goal

### Problem Statement

Doctors using MidiMed spend significant time manually typing medical record details into the form when completing appointments. The medical record form has multiple sections (summary, vitals, diagnosis, medications, follow-up instructions, notes), and filling each field by hand is slow -- especially on mobile devices where typing is cumbersome. This friction directly opposes MidiMed's core promise: "Doctor spends less time on paperwork, more time with patients."

### What This Feature Achieves

AI Dictation allows doctors to speak naturally about a patient visit and have the system automatically transcribe, interpret, and distribute that information into the correct medical record form fields. Instead of typing into 6+ fields, the doctor presses one button, talks, and the form fills itself. The doctor then reviews, adjusts if needed, and saves.

### Target Users

- **Primary:** Dr. Maria (Admin/Provider) -- runs a small clinic, manages 50-200 patients, values simplicity over feature complexity. She uses MidiMed on both desktop and mobile (often a phone between appointments).
- **Secondary:** Any provider role user completing appointments or creating medical records.
- **Not in scope:** Staff users (Sofia) who do not create medical records.

### Expected User Value

- Reduce medical record completion time from minutes to seconds.
- Eliminate friction of typing on mobile devices during or between appointments.
- Maintain structured, organized records despite free-form spoken input.
- Make MidiMed feel intelligent and modern -- a key differentiator for the Latin American market.

### Language Context

- The UI is in Spanish (Latin American). All button labels, status messages, error messages, and instructions must be in Spanish.
- Doctors will dictate in Spanish. The transcription and field extraction must handle Spanish medical terminology.

---

## 2. Overall Acceptance Criteria

The AI Dictation feature is complete and successful when:

1. A microphone button is visible and accessible within the medical record form on both desktop and mobile.
2. A doctor can press the button to start recording, speak freely about any combination of form fields, and press again to stop.
3. The spoken audio is transcribed into text accurately, including Spanish medical terminology.
4. The transcript is analyzed and mapped to the correct form fields: summary, vitals (height, weight, blood pressure, temperature), diagnosis, medications, follow-up instructions, and notes.
5. Form fields are auto-populated with the extracted data. The doctor can see what was filled and review it before saving.
6. Existing content in form fields is preserved when dictation does not address those fields (dictation merges, does not overwrite blanks).
7. The feature works on mobile (touch-friendly, 44px+ touch targets) and desktop.
8. Error states are handled gracefully: microphone permission denied, network failures, transcription failures, and extraction failures all produce clear Spanish-language feedback.
9. The feature uses the existing AI provider configuration and does not require additional setup by the doctor or clinic admin.
10. Processing states (recording, transcribing, analyzing) are clearly communicated to the user with visual indicators.

---

## 3. User Flows

### Flow 1: Happy Path -- Successful Dictation and Form Auto-Fill

**Context:** Dr. Maria has just finished seeing a patient. She opens the medical record form (either by completing an appointment or creating a new record). She wants to quickly capture the visit details.

**Steps:**

1. Doctor opens the medical record form modal. The form fields are empty (create mode) or pre-filled (edit mode).
2. Doctor sees a microphone/dictation button prominently placed within the form. The button indicates it is ready (idle state).
3. Doctor taps/clicks the dictation button.
4. The system requests microphone permission from the browser (if not already granted).
5. Permission is granted. The button transitions to a "recording" state with a clear visual indicator (e.g., pulsing animation, color change, recording duration timer).
6. Doctor speaks freely. Example: "El paciente acude por dolor abdominal de tres dias. Peso setenta y dos kilos, altura un metro sesenta y cinco, presion arterial ciento veinte sobre ochenta, temperatura treinta y siete grados. Diagnostico gastritis aguda. Le receto omeprazol veinte miligramos una capsula cada doce horas por catorce dias. Control en dos semanas con resultados de laboratorio."
7. Doctor taps/clicks the button again to stop recording.
8. Button transitions to a "processing" state with a clear indicator (e.g., spinner, "Transcribiendo..." / "Analizando..." text).
9. The system transcribes the audio to text.
10. The system analyzes the transcript and extracts structured fields.
11. Form fields are auto-populated:
    - **Summary:** "El paciente acude por dolor abdominal de tres dias."
    - **Vitals:** weight = 72 kg, height = 165 cm, blood pressure = "120/80", temperature = 37.0
    - **Diagnosis:** "Gastritis aguda"
    - **Medications:** "Omeprazol 20mg - 1 capsula cada 12 horas por 14 dias"
    - **Follow-up:** "Control en 2 semanas con resultados de laboratorio"
    - **Notes:** (empty -- doctor did not mention notes)
12. The button returns to idle state. A success notification (toast) confirms the form was filled.
13. Doctor reviews the auto-filled fields, makes any adjustments, and saves the record normally.

**Key Behavior:**
- Only fields mentioned in the dictation are populated. Fields not addressed remain unchanged.
- If the form already had content (edit mode), dictation content replaces matching fields but leaves unmentioned fields untouched.
- Vitals are converted to numeric values and proper units (cm, kg, degrees C, blood pressure as string).

---

### Flow 2: Partial Dictation -- Doctor Dictates Only Some Fields

**Context:** Dr. Maria has already typed the summary and vitals. She wants to dictate just the diagnosis and medications.

**Steps:**

1. Doctor has partially filled the form (summary and vitals are already populated).
2. Doctor taps the dictation button and records: "Diagnostico infeccion de vias urinarias. Receto ciprofloxacina quinientos miligramos cada doce horas por siete dias y abundantes liquidos."
3. Doctor stops recording. System processes the audio.
4. Only the diagnosis and medications fields are updated. Summary and vitals remain as the doctor previously entered them.
5. Doctor reviews and saves.

**Key Behavior:**
- The system must not clear or overwrite fields that were not mentioned in the dictation.
- If a field already has content and the dictation also addresses that field, the dictated content replaces the existing content for that field.

---

### Flow 3: Dictation with Custom Tenant Fields

**Context:** A clinic has configured custom fields (e.g., "Tipo de sangre", "Alergias conocidas"). The doctor mentions these during dictation.

**Steps:**

1. Doctor opens the medical record form. Custom fields section is present because the tenant has configured extra fields.
2. Doctor dictates and mentions: "...alergias conocidas: penicilina. Tipo de sangre O positivo..."
3. System processes and recognizes these as custom tenant fields.
4. Custom fields are populated if the AI can match the dictated content to the configured custom field names.
5. If the AI cannot confidently match a piece of dictation to a custom field, the information is placed in the notes field as a fallback.

**Key Behavior:**
- Custom field mapping is best-effort. The system should attempt to match based on field names configured by the tenant.
- Unmatched information should not be lost -- it goes to notes.

---

### Flow 4: Microphone Permission Denied

**Context:** Dr. Maria taps the dictation button but her browser blocks microphone access.

**Steps:**

1. Doctor taps the dictation button.
2. Browser prompts for microphone permission (or immediately denies if previously blocked).
3. Permission is denied.
4. The system shows a clear error notification in Spanish: "No se pudo acceder al microfono. Verifica los permisos de tu navegador."
5. The button returns to idle state. The form is unaffected.
6. Doctor can still fill the form manually or resolve the browser permission and try again.

**Key Behavior:**
- The error message should be actionable -- tell the user what to do.
- No partial state or broken UI.

---

### Flow 5: Network or AI Service Failure

**Context:** The doctor records audio successfully, but the transcription or field extraction service fails (network timeout, API error, rate limit).

**Steps:**

1. Doctor records and stops.
2. Processing state begins.
3. The transcription or analysis step fails.
4. The system shows a clear error notification: "Error al procesar la dictacion. Por favor intenta de nuevo." If possible, distinguish between transcription failure and analysis failure.
5. The button returns to idle state. The form remains unchanged (no partial data is written).
6. Doctor can retry by pressing the button again, or fill the form manually.

**Key Behavior:**
- No partial or corrupted data should be written to the form on failure.
- The doctor's existing form entries must be preserved.
- The audio recording is discarded after failure (not persisted).

---

### Flow 6: Dictation on Mobile Device

**Context:** Dr. Maria is on her phone, using the medical record form which displays one section at a time (mobile tab navigation).

**Steps:**

1. Doctor opens the medical record form on mobile. The form is in section-tab mode.
2. The dictation button is visible regardless of which section tab is active (it is not tied to a specific section).
3. Doctor taps the dictation button. Touch target is at least 44px for comfortable use.
4. Recording starts. The visual indicator is clear and visible even on small screens.
5. Doctor dictates (may mention fields across multiple sections).
6. Doctor taps to stop. Processing occurs.
7. All relevant fields across all sections are populated, even sections the doctor is not currently viewing.
8. Doctor can navigate through section tabs to review all auto-filled content.

**Key Behavior:**
- The dictation button must be accessible from any section tab on mobile.
- Auto-filled fields across all sections must be populated, not just the currently visible section.
- The button must not interfere with mobile section navigation or the form action buttons.

---

### Flow 7: Multiple Dictation Rounds

**Context:** Dr. Maria dictates once, reviews, then realizes she forgot to mention medications. She dictates again.

**Steps:**

1. Doctor completes a first dictation round. Form is partially filled.
2. Doctor reviews and notices medications are empty.
3. Doctor taps the dictation button again: "Recetar amoxicilina quinientos miligramos cada ocho horas por diez dias."
4. Processing completes. The medications field is now populated.
5. Previously filled fields from the first dictation remain unchanged.

**Key Behavior:**
- Multiple dictation rounds are supported.
- Each round merges results into the form. Fields already filled by a previous round are only overwritten if the new dictation explicitly addresses them.

---

## 4. Flow-Specific Acceptance Criteria

### Flow 1: Happy Path

1. When the doctor taps the dictation button and grants microphone permission, recording starts within 1 second and the button shows a recording state.
2. When the doctor stops recording, a processing indicator appears immediately and the form is populated within a reasonable time (dependent on audio length, but typically under 10 seconds for a 30-second recording).
3. The extracted data is placed into the correct form fields (summary, vitals, diagnosis, medications, follow-up, notes) matching what the doctor said.
4. Vitals are converted to proper numeric types and units (e.g., "setenta y dos kilos" becomes 72 in the weight field).
5. A success toast notification appears in Spanish confirming the form was auto-filled.
6. The form is in a reviewable state -- the doctor can edit any auto-filled field before saving.

### Flow 2: Partial Dictation

1. When the doctor dictates content addressing only a subset of fields, only those fields are populated.
2. Fields that already contain data and are not mentioned in the dictation retain their existing values.
3. Fields that already contain data and ARE mentioned in the dictation are updated with the new dictated content.

### Flow 3: Custom Tenant Fields

1. If the tenant has configured custom fields, the system attempts to match dictated content to those field names.
2. Content that matches a custom field name is placed in the corresponding custom field.
3. Content that cannot be matched to any standard or custom field is placed in the notes field.
4. No dictated information is silently discarded.

### Flow 4: Microphone Permission Denied

1. When the browser denies microphone permission, an error toast appears in Spanish within 2 seconds.
2. The error message includes guidance on how to resolve the issue (check browser permissions).
3. The form state is completely unaffected.
4. The dictation button returns to idle state and is re-usable.

### Flow 5: Network / AI Failure

1. When transcription or analysis fails, an error toast appears in Spanish.
2. No partial or incorrect data is written to any form field.
3. The doctor's existing form content is preserved exactly as it was before the dictation attempt.
4. The dictation button returns to idle state and the doctor can retry immediately.
5. The failed audio recording is not stored or persisted.

### Flow 6: Mobile

1. The dictation button has a minimum touch target of 44px x 44px.
2. The dictation button is accessible from any section tab in the mobile form view.
3. Fields populated by dictation span all sections, not just the currently visible one.
4. The recording and processing indicators are visible and legible on screens as small as 375px wide (iPhone SE).
5. The dictation button does not overlap or obstruct the mobile section navigation tabs or the form action buttons (Cancelar / Guardar).

### Flow 7: Multiple Dictation Rounds

1. The dictation button is re-usable after a completed dictation round (success or failure).
2. A second dictation round merges new results with existing form content.
3. Fields not addressed in the second dictation remain unchanged from the first round.
4. There is no limit on the number of dictation rounds per form session.

---

## 5. Additional Product Requirements

### Button States

The dictation button must have four distinct, visually clear states:

| State | Visual | Interaction |
|-------|--------|-------------|
| **Idle** | Microphone icon, neutral color | Tap to start recording |
| **Recording** | Animated indicator (pulse/glow), prominent color, optional duration counter | Tap to stop recording |
| **Processing** | Spinner or progress indicator, label like "Procesando..." | Non-interactive (disabled) |
| **Error** | Brief error state before returning to idle | Non-interactive (momentary) |

### Button Placement

- The dictation button should be placed in the form header area, near the modal title, so it is always visible regardless of scroll position or active section.
- On mobile, it must not interfere with the section tab bar or the bottom action buttons.

### Audio Constraints

- There is no hard time limit on recording, but the system should support recordings up to at least 2 minutes (covering a typical dictation session).
- If the audio is too short (less than ~1 second), the system should show a gentle prompt: "La grabacion fue muy corta. Intenta de nuevo."

### Data Privacy

- Audio recordings are not stored persistently. They are sent for transcription and discarded after processing.
- Transcription text is used only for field extraction during the active session and is not stored separately from the medical record.

### Plan Availability

- AI Dictation should be available on PRO and ENTERPRISE plans, consistent with how "AI summaries" are gated (PRO and above).
- BASIC plan users and TRIAL users should see the dictation button but receive a prompt to upgrade when they tap it: "La dictacion por IA esta disponible en el plan Pro."
- TRIAL users with full feature access (per pricing model: "Do NOT gate basic features during trial") should have access during their 30-day trial.

### Performance Expectations

- Recording start: immediate (< 1 second after permission granted).
- Processing time: proportional to audio length. For a 30-second recording, total processing (transcription + extraction) should complete in under 15 seconds under normal conditions.
- The form must remain interactive during processing (doctor can manually edit other fields while waiting).

---

## 6. Out of Scope

The following are explicitly NOT part of this feature:

- Real-time streaming transcription (live text appearing as the doctor speaks). This is a record-then-process flow.
- Voice commands to navigate the form or trigger save/cancel actions.
- Dictation for any form other than the medical record form.
- Audio playback or re-listening to recordings.
- Persistent storage of audio recordings or raw transcripts.
- Support for languages other than Spanish.
- Offline dictation or on-device transcription.

---

## 7. Handoff to Engineering

This product specification is complete and ready for the engineering-architect agent. The engineering team is responsible for:

- Designing the technical architecture (API routes, hooks, component structure).
- Defining the AI prompt strategy for field extraction.
- Creating implementation tickets based on this specification.
- Making technology and implementation trade-off decisions.
- Estimating development effort.

All user-facing behaviors, acceptance criteria, and product constraints are defined in this document. Technical design should satisfy these product requirements while adhering to the project's established standards and tech stack.
