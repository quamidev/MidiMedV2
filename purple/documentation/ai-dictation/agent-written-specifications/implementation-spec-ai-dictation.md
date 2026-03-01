# Engineering Implementation Specification: AI Dictation for Medical Records

**Feature:** AI Dictation Interpretation for Medical Records
**GitHub Issue:** #1
**Date:** 2026-02-28
**Status:** Ready for Implementation

---

## 1. Executive Summary

AI Dictation enables doctors to press a microphone button inside the medical record form, speak naturally in Spanish about a patient visit, and have the system automatically transcribe, interpret, and distribute that information into the correct form fields. The system uses a record-then-process flow: capture audio via MediaRecorder API, send to an API route that performs two-step AI processing (Whisper transcription then GPT-4o-mini structured extraction), and merge the extracted fields into the React Hook Form instance.

### Key Technical Decisions

1. **Vercel AI SDK `experimental_transcribe`** for Whisper transcription -- avoids adding a new `openai` npm dependency since `@ai-sdk/openai` already supports `openai.transcription('whisper-1')`.
2. **`generateText` with `Output.object()`** (AI SDK v6 pattern) for structured field extraction with Zod schema validation -- consistent with the direction of the existing codebase's AI SDK v6 usage.
3. **Single API route** at `/api/ai/dictation` that handles both transcription and extraction in sequence -- simplifies the client to a single fetch call.
4. **MediaRecorder API** with `audio/webm;codecs=opus` (Chrome/Edge/Safari) or `audio/ogg;codecs=opus` (Firefox fallback) -- both formats are natively supported by OpenAI Whisper.
5. **Client-side plan gating** via `useUser()` context -- the tenant's `billing_plan` and `billing_status` are already available; no server-side gate needed since the API route validates auth anyway.

### Estimated Scope

- **3 Phases**, **7 Tickets**
- Estimated total effort: ~3-5 engineering days

---

## 2. Technical Architecture

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  MedicalRecordForm (existing)                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  DictationButton component                                │  │
│  │  - Manages recording UI states (idle/recording/processing)│  │
│  │  - Calls useDictation() hook                              │  │
│  └───────────────┬───────────────────────────────────────────┘  │
│                   │                                              │
│  ┌───────────────▼───────────────────────────────────────────┐  │
│  │  useDictation() hook                                       │  │
│  │  - MediaRecorder API for audio capture                     │  │
│  │  - Microphone permission handling                          │  │
│  │  - POST audio blob to /api/ai/dictation                    │  │
│  │  - Returns ExtractedMedicalFields                          │  │
│  └───────────────┬───────────────────────────────────────────┘  │
│                   │ form.setValue() for each extracted field      │
│                   ▼                                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  React Hook Form instance (existing)                       │  │
│  │  Fields: summary, vitals.*, diagnosis, medications,        │  │
│  │          followUpInstructions, notes, extras.*              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

                            │ POST /api/ai/dictation
                            │ Content-Type: multipart/form-data
                            │ Body: { audio: Blob, customFieldNames?: string[] }
                            ▼

┌─────────────────────────────────────────────────────────────────┐
│  /api/ai/dictation (API Route)                                  │
│                                                                  │
│  Step 1: Transcribe audio                                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  experimental_transcribe()                                 │  │
│  │  model: openai.transcription('whisper-1')                  │  │
│  │  language: 'es'                                            │  │
│  │  Returns: { text: string }                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Step 2: Extract structured fields                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  generateText() with Output.object()                       │  │
│  │  model: openai('gpt-4o-mini')                              │  │
│  │  schema: extractedMedicalFieldsSchema (Zod)                │  │
│  │  system: Spanish medical extraction prompt                 │  │
│  │  Returns: ExtractedMedicalFields                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Response: { success, transcript, fields }                       │
└─────────────────────────────────────────────────────────────────┘
```

### Data Models

No new database tables are required. Audio is ephemeral (never persisted). The extracted fields map directly to the existing `MedicalRecordFormValues` shape defined in `medical-record-form.tsx`.

#### New Type: `ExtractedMedicalFields`

```typescript
// Location: src/types/app.ts (append to existing file)

interface ExtractedVitals {
  heightCm: number | null
  weightKg: number | null
  bloodPressure: string | null
  temperatureC: number | null
}

interface ExtractedMedicalFields {
  summary: string | null
  vitals: ExtractedVitals | null
  diagnosis: string | null
  medications: string | null  // Newline-separated, matches textarea format
  followUpInstructions: string | null
  notes: string | null
  extras: Record<string, string> | null  // Custom field name -> value
}
```

Fields are nullable to support partial dictation (only mentioned fields get values). `null` means "not mentioned in dictation; do not overwrite."

#### API Route Request/Response Shapes

**Request:** `multipart/form-data`
- `audio`: File (webm/ogg blob, max 25MB)
- `customFieldNames`: JSON string array of custom field names (optional)

**Response:**
```typescript
// Success
{
  success: true,
  data: {
    transcript: string,
    fields: ExtractedMedicalFields
  }
}

// Error
{
  success: false,
  error: string  // Spanish error message
}
```

### Authentication & Authorization

- The API route must validate the user session via Supabase server client (same pattern as existing AI routes).
- Plan gating is done client-side via `useUser()` -- the dictation button shows an upgrade prompt for BASIC plan users. TRIAL users with `TRIAL_ACTIVE` status have access (per pricing standard: "Do NOT gate basic features during trial").
- Server-side plan validation is NOT required since the dictation endpoint does not persist data -- it only returns extracted fields for client-side review.

### Third-Party Integrations

| Service | Usage | SDK |
|---------|-------|-----|
| OpenAI Whisper (`whisper-1`) | Audio transcription | `@ai-sdk/openai` via `openai.transcription()` |
| OpenAI GPT-4o-mini | Structured field extraction | `@ai-sdk/openai` via `openai('gpt-4o-mini')` |
| Browser MediaRecorder API | Audio capture | Native Web API |

### State Management

All dictation state is local to the hook (`useDictation`). No global state or context additions needed. The hook manages:

| State | Type | Description |
|-------|------|-------------|
| `status` | `'idle' \| 'recording' \| 'processing' \| 'error'` | Current dictation lifecycle |
| `recordingDuration` | `number` | Seconds elapsed during recording |
| `error` | `string \| null` | Spanish error message |

---

## 3. Implementation Phases

### Phase 1: API Route & AI Processing

**Objective:** Build the server-side endpoint that accepts audio, transcribes it, and extracts structured medical fields.

**Dependencies:** None -- this is the foundation.

**Success Criteria:**
- The endpoint at `/api/ai/dictation` accepts audio blobs and returns structured fields.
- Zod validation rejects invalid requests with Spanish error messages.
- Both transcription and extraction errors are handled gracefully.
- Can be tested independently via cURL/Postman with a recorded audio file.

---

### Phase 2: Client Hook & Audio Capture

**Objective:** Build the `useDictation` hook that manages MediaRecorder, microphone permissions, and communicates with the API route.

**Dependencies:** Phase 1 (API route must exist for the hook to call).

**Success Criteria:**
- Hook handles full recording lifecycle (start, stop, process).
- Microphone permission denial produces a Spanish error message.
- Audio too short (< 1 second) is rejected client-side.
- Hook returns extracted fields on success, error message on failure.

---

### Phase 3: UI Component & Form Integration

**Objective:** Build the DictationButton component and integrate it into the existing MedicalRecordForm.

**Dependencies:** Phase 2 (hook must be complete).

**Success Criteria:**
- Button displays four visual states (idle, recording, processing, error).
- Button is placed in the form header, visible on all section tabs (mobile).
- Extracted fields merge into the form via `form.setValue()`.
- Plan gating shows upgrade toast for BASIC users.
- Recording timer displays during recording.
- Success/error toasts appear in Spanish.

---

## 4. Detailed Tickets

### Phase 1: API Route & AI Processing

---

#### DICT-001: Define Dictation Types and Zod Schemas

**Title:** Define ExtractedMedicalFields types and Zod validation schemas

**Objective:** Establish the shared type contract between the API route and the client hook.

**Contract/Interface:**

```typescript
// Types to define in src/types/app.ts
interface ExtractedVitals { ... }
interface ExtractedMedicalFields { ... }
interface DictationApiResponse { ... }

// Zod schema to define in src/lib/ai/dictation-schemas.ts
const extractedVitalsSchema: z.ZodType<ExtractedVitals>
const extractedMedicalFieldsSchema: z.ZodType<ExtractedMedicalFields>
```

**Files:**
- `src/types/app.ts` -- Append new interfaces
- `src/lib/ai/dictation-schemas.ts` -- New file: Zod schemas for extracted fields and API request validation

**Pattern Reference:**
- `src/types/app.ts` -- Follow the existing section pattern with clear `// =============================================================================` separators and JSDoc comments. See `VitalsInput` and `MedicalRecordFormValues` for the data shape to mirror.
- The Zod schema shape must mirror the form schema in `src/components/medical-records/medical-record-form.tsx` lines 64-79 (the `medicalRecordFormSchema`), but with all fields nullable to represent "not mentioned."

**Key Considerations:**
- `medications` is a single string with newline separators (matching the textarea format in the form), NOT an array. The form converts to/from array at submission time.
- `extras` maps custom field names (strings) to extracted values. The API route receives custom field names from the client so the LLM knows what to look for.
- Use `.describe()` on Zod schema properties to guide the LLM's structured output (e.g., `z.number().nullable().describe('Patient height in centimeters, converted from spoken units')`).
- Vitals values must be numeric -- the LLM must convert spoken words like "setenta y dos kilos" into `72`.

**Acceptance Criteria:**
- [ ] `ExtractedVitals` and `ExtractedMedicalFields` interfaces added to `src/types/app.ts`
- [ ] `DictationApiResponse` type (success/error union) added to `src/types/app.ts`
- [ ] Zod schemas in `src/lib/ai/dictation-schemas.ts` match the type interfaces
- [ ] All Zod schema fields have `.describe()` annotations for LLM guidance
- [ ] `bun run build` passes
- [ ] `bun run lint` passes

**Estimated Effort:** S

**Dependencies:** None

---

#### DICT-002: Build the AI Dictation API Route

**Title:** Create POST `/api/ai/dictation` endpoint with transcription and extraction

**Objective:** Implement the server-side pipeline that accepts audio, transcribes via Whisper, extracts structured fields via GPT-4o-mini, and returns them.

**Contract/Interface:**

```typescript
// POST /api/ai/dictation
// Content-Type: multipart/form-data
// Request body: FormData with 'audio' file and optional 'customFieldNames' JSON string

// Response: NextResponse<DictationApiResponse>
```

**Files:**
- `src/app/api/ai/dictation/route.ts` -- New file: POST handler
- `src/lib/ai/dictation-extract.ts` -- New file: extraction logic (system prompt + generateText call)

**Pattern Reference:**
- `src/app/api/ai/appointment-summary/route.ts` -- Follow this exact pattern for: Zod request validation, try/catch structure, error response shape (`{ success: false, error: string }`), and `console.error` usage.
- `src/lib/ai/patient-summary.ts` -- Follow this pattern for: imports from `./config`, retry logic with `MAX_RETRIES` and `delay()`, and separation of AI logic into a dedicated lib file.
- `src/lib/ai/config.ts` -- Import `openai` and `model` from here. The `openai` export is the provider instance needed for `openai.transcription('whisper-1')`.

**Key Considerations:**
- **Transcription step:** Use `experimental_transcribe` from `'ai'` with `openai.transcription('whisper-1')`. Pass audio as a `Uint8Array` (convert from the FormData file blob). Set `providerOptions: { openai: { language: 'es' } }` to hint Spanish.
- **Extraction step:** Use `generateText` with `Output.object()` from `'ai'` and the Zod schema from DICT-001. The system prompt must instruct the model to: (a) extract only fields explicitly mentioned, (b) return `null` for unmentioned fields, (c) convert spoken numbers/units to numeric values for vitals, (d) map custom field content to provided field names or place in notes as fallback.
- **Audio validation:** Check file size (reject > 25MB per OpenAI limit), check MIME type (allow `audio/webm`, `audio/ogg`, `audio/mp4`, `audio/mpeg`, `audio/wav`).
- **Short audio guard:** If the transcript is empty or nearly empty (< 5 characters), return an error: "La grabacion fue muy corta. Intenta de nuevo."
- **No auth check needed:** The existing AI routes (`appointment-summary`, `patient-summary`) do not check auth because they are internal. Follow the same pattern. If auth is desired later, it can be added.
- The system prompt for extraction is critical to quality. It should be written in Spanish, reference medical terminology, and include examples of vitals conversion.

**Acceptance Criteria:**
- [ ] `POST /api/ai/dictation` accepts multipart form data with an `audio` field
- [ ] Transcription returns accurate Spanish text using Whisper
- [ ] Extraction returns a valid `ExtractedMedicalFields` object conforming to the Zod schema
- [ ] Fields not mentioned in the dictation are `null` in the response
- [ ] Vitals are converted to numeric values (e.g., "setenta y dos kilos" -> `72`)
- [ ] Custom field names are matched when provided
- [ ] Unmatched dictation content falls back to `notes`
- [ ] Audio larger than 25MB returns a 400 error with Spanish message
- [ ] Transcription failures return a 500 error with Spanish message
- [ ] Extraction failures return a 500 error with Spanish message
- [ ] Empty/very short transcripts return an error with "grabacion muy corta" message
- [ ] `bun run build` passes
- [ ] `bun run lint` passes

**Estimated Effort:** L

**Dependencies:** DICT-001

---

### Phase 2: Client Hook & Audio Capture

---

#### DICT-003: Build the `useDictation` Hook

**Title:** Create `useDictation` hook for audio recording and API communication

**Objective:** Encapsulate all recording, permission, and API logic in a reusable hook.

**Contract/Interface:**

```typescript
// src/hooks/use-dictation.ts

interface UseDictationOptions {
  customFieldNames?: string[]
}

interface UseDictationReturn {
  status: 'idle' | 'recording' | 'processing' | 'error'
  recordingDuration: number  // seconds
  error: string | null
  startRecording: () => Promise<void>
  stopRecording: () => Promise<ExtractedMedicalFields | null>
  cancelRecording: () => void
}

function useDictation(options?: UseDictationOptions): UseDictationReturn
```

**Files:**
- `src/hooks/use-dictation.ts` -- New file

**Pattern Reference:**
- `src/hooks/use-notifications.ts` -- Follow this pattern for: JSDoc header with date, `'use client'` directive, interface definitions for options and return type, `useCallback` for all action functions, and return object structure.
- The hook should use refs (`useRef`) for MediaRecorder and audio chunks to avoid stale closure issues during recording callbacks.

**Key Considerations:**
- **MediaRecorder MIME type:** Check `MediaRecorder.isTypeSupported('audio/webm;codecs=opus')` first (Chrome/Edge/Safari). Fall back to `audio/ogg;codecs=opus` (Firefox). If neither supported, return an error.
- **Microphone permissions:** Use `navigator.mediaDevices.getUserMedia({ audio: true })`. Catch `NotAllowedError` for permission denied and `NotFoundError` for no microphone. Return Spanish error messages per product spec.
- **Recording duration timer:** Use `setInterval` during recording, increment a counter each second, clean up on stop/cancel.
- **Audio too short guard:** If recording duration < 1 second, do not send to API. Return error: "La grabacion fue muy corta. Intenta de nuevo."
- **API call:** POST to `/api/ai/dictation` with FormData containing the audio blob and optional custom field names. Parse JSON response.
- **Cleanup:** On unmount, stop any active MediaRecorder stream and clear interval timers. Use a cleanup function in `useEffect` or `useRef` tracking.
- **Error recovery:** After error state, automatically transition back to idle after a brief delay (~3 seconds) so the button is re-usable.

**Acceptance Criteria:**
- [ ] Hook returns correct status through full lifecycle: idle -> recording -> processing -> idle (or error -> idle)
- [ ] `startRecording()` requests microphone permission and starts MediaRecorder
- [ ] `stopRecording()` stops recording, sends audio to API, returns extracted fields
- [ ] `cancelRecording()` stops recording without API call, returns to idle
- [ ] Microphone permission denied shows Spanish error from product spec
- [ ] Recording < 1 second shows "grabacion muy corta" error
- [ ] Recording duration counter increments each second during recording
- [ ] Network/API errors are caught and surfaced as Spanish error messages
- [ ] Component unmount cleans up MediaRecorder stream and timers
- [ ] `bun run build` passes
- [ ] `bun run lint` passes

**Estimated Effort:** M

**Dependencies:** DICT-002 (needs API route to call, but can be developed with mock responses)

---

### Phase 3: UI Component & Form Integration

---

#### DICT-004: Build the DictationButton Component

**Title:** Create DictationButton with four visual states

**Objective:** Build a self-contained button component that visualizes the dictation lifecycle states.

**Contract/Interface:**

```typescript
// src/components/medical-records/dictation-button.tsx

interface DictationButtonProps {
  status: 'idle' | 'recording' | 'processing' | 'error'
  recordingDuration: number
  disabled?: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  className?: string
}

function DictationButton(props: DictationButtonProps): JSX.Element
```

**Files:**
- `src/components/medical-records/dictation-button.tsx` -- New file

**Pattern Reference:**
- `src/components/medical-records/medical-record-form.tsx` -- Same directory, follow its import patterns and component structure.
- The existing form uses `lucide-react` icons (`Loader2`, `Stethoscope`, etc.) -- use `Mic` and `Square` (stop) from lucide-react.
- The existing form uses `framer-motion` for animations -- use it for the recording pulse animation.
- Use `cn()` from `@/lib/utils` for conditional class merging.

**Key Considerations:**
- **Four states per product spec:**
  - **Idle:** `Mic` icon, neutral color (muted background). Clickable.
  - **Recording:** Pulsing animation (framer-motion `animate` with scale/opacity loop), `Square` (stop) icon, destructive/red color, duration counter display formatted as `MM:SS`. Clickable to stop.
  - **Processing:** `Loader2` with `animate-spin`, "Procesando..." label. Disabled/non-interactive.
  - **Error:** Brief red flash before returning to idle. Non-interactive (momentary, controlled by parent).
- **Touch target:** Minimum 44x44px (`min-h-11 min-w-11` or explicit `h-11 w-11`).
- **Duration format:** `0:00`, `0:15`, `1:30`, etc. Use a simple format helper, not a library.
- **Dark mode:** Use semantic color classes (e.g., `bg-destructive` for recording state) that automatically adapt.
- The component is "dumb" -- it receives status and handlers as props. All logic lives in the hook.

**Acceptance Criteria:**
- [ ] Renders four distinct visual states matching product spec table
- [ ] Idle state shows Mic icon with neutral styling
- [ ] Recording state shows pulsing animation, stop icon, and MM:SS timer
- [ ] Processing state shows spinner with "Procesando..." text
- [ ] Error state shows brief visual indication
- [ ] Touch target is at least 44x44px
- [ ] Works in both light and dark mode
- [ ] Accepts `className` prop for positioning customization
- [ ] `bun run build` passes
- [ ] `bun run lint` passes

**Estimated Effort:** M

**Dependencies:** None (pure presentational component, can be built in parallel with Phase 2)

---

#### DICT-005: Integrate DictationButton into MedicalRecordForm

**Title:** Add dictation button to form header and wire up field merging

**Objective:** Connect the DictationButton and useDictation hook into the existing MedicalRecordForm, including field merging logic and plan gating.

**Contract/Interface:**

```typescript
// Inside MedicalRecordForm component:
// 1. Call useDictation() hook
// 2. Render DictationButton in DialogHeader
// 3. On successful dictation, merge fields via form.setValue()
// 4. Check tenant.billing_plan for plan gating
```

**Files:**
- `src/components/medical-records/medical-record-form.tsx` -- Modify existing file

**Pattern Reference:**
- The form already uses `useUser()` to access `tenant` (line 133) -- use `tenant.billing_plan` and `tenant.billing_status` for plan gating.
- The form already uses `form.setValue()` implicitly via `reset()` -- use explicit `form.setValue('summary', value, { shouldDirty: true })` calls for each extracted field.
- The form already uses `toast` from `sonner` for notifications -- use the same pattern for success/error toasts.
- The form already accesses `customFields` from tenant config (line 138-141) -- pass custom field names to the hook.

**Key Considerations:**
- **Button placement:** Inside `DialogHeader`, next to the title/description block. The existing header has a flex layout with an icon + title; add the DictationButton to the right side of this flex container.
- **Field merging logic:** Only set fields where the extracted value is NOT null. This preserves existing content for unmentioned fields. For each non-null field:
  - `form.setValue('summary', fields.summary, { shouldDirty: true })`
  - `form.setValue('vitals.heightCm', fields.vitals.heightCm, { shouldDirty: true })`
  - etc.
- **Medications field:** The extracted `medications` is a newline-separated string (matching the textarea format). Set directly.
- **Custom fields (extras):** For each key in `fields.extras`, call `form.setValue(\`extras.${key}\`, value, { shouldDirty: true })`.
- **Plan gating:** Before starting recording, check:
  - If `billing_plan === 'BASIC'` AND `billing_status !== 'TRIAL_ACTIVE'`, show toast: "La dictacion por IA esta disponible en el plan Pro." and do NOT start recording.
  - TRIAL users with `billing_status === 'TRIAL_ACTIVE'` SHOULD have access.
  - PRO and ENTERPRISE always have access.
- **Success toast:** After merging fields, show: "Dictado procesado exitosamente" with a description like "Los campos han sido actualizados."
- **Mobile considerations:** The button must be visible regardless of which section tab is active. Since it is in the DialogHeader (which is outside the scrollable form area), this is automatically satisfied.

**Acceptance Criteria:**
- [ ] DictationButton appears in the form header on both desktop and mobile
- [ ] Button does not interfere with mobile section tabs or action buttons
- [ ] Clicking button starts recording (via useDictation hook)
- [ ] On successful dictation, only non-null fields are merged into the form
- [ ] Previously filled fields not mentioned in dictation are preserved
- [ ] Fields mentioned in dictation overwrite existing content
- [ ] Custom tenant fields are populated when matched
- [ ] Success toast appears in Spanish after field merge
- [ ] Error toast appears in Spanish on failure
- [ ] BASIC plan users see upgrade toast instead of recording
- [ ] TRIAL_ACTIVE users can use dictation
- [ ] PRO and ENTERPRISE users can use dictation
- [ ] Multiple dictation rounds work (second round merges without clearing first)
- [ ] Form remains interactive during processing
- [ ] `bun run build` passes
- [ ] `bun run lint` passes

**Estimated Effort:** M

**Dependencies:** DICT-003, DICT-004

---

#### DICT-006: Add Framer Motion Recording Pulse Animation

**Title:** Implement the pulsing/glow animation for the recording state

**Objective:** Create a visually distinctive recording indicator that makes the active recording state unmistakable, especially on mobile.

**Contract/Interface:**

The DictationButton component (DICT-004) needs a pulsing ring/glow animation during the recording state. This ticket focuses specifically on the animation implementation.

**Files:**
- `src/components/medical-records/dictation-button.tsx` -- Enhance the recording state (created in DICT-004)

**Pattern Reference:**
- `src/components/medical-records/medical-record-form.tsx` -- Uses `framer-motion` `motion.div` with `variants` for section animations (lines 112-116, 404-447). Follow this pattern.
- The existing codebase uses `framer-motion` extensively (`AnimatePresence`, `motion.div`). Use `motion.div` with `animate` for the pulsing effect.

**Key Considerations:**
- Use a `motion.div` wrapper around or behind the button with an infinite scale+opacity animation: `animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}` with `transition={{ repeat: Infinity, duration: 1.5 }}`.
- Use `bg-destructive/30` or similar for the pulse ring color (red/destructive to indicate active recording).
- The animation must be performant on mobile -- use `transform` and `opacity` only (GPU-composited properties).
- Consider using `will-change: transform` via Tailwind's `will-change-transform` class.
- The pulse should be a ring/circle behind the button, not the button itself scaling.

**Acceptance Criteria:**
- [ ] Recording state shows a pulsing ring animation behind the button
- [ ] Animation is smooth at 60fps on mobile devices
- [ ] Animation stops immediately when recording ends
- [ ] Uses semantic destructive color that works in both light and dark mode
- [ ] `bun run build` passes
- [ ] `bun run lint` passes

**Estimated Effort:** S

**Dependencies:** DICT-004

---

#### DICT-007: Manual Testing & Edge Case Handling

**Title:** End-to-end manual testing of all dictation flows and edge cases

**Objective:** Verify all 7 product flows work correctly on desktop and mobile, and handle edge cases gracefully.

**Files:**
- No new files. May require minor fixes to files created in DICT-001 through DICT-006.

**Key Considerations:**

Test each product flow from the spec:
1. **Flow 1 (Happy Path):** Full dictation with all fields mentioned. Verify field mapping accuracy.
2. **Flow 2 (Partial Dictation):** Dictate only diagnosis/medications. Verify other fields preserved.
3. **Flow 3 (Custom Fields):** If tenant has custom fields, dictate matching content. Verify mapping and notes fallback.
4. **Flow 4 (Permission Denied):** Block microphone in browser settings. Verify error toast and recovery.
5. **Flow 5 (Network Failure):** Disable network during processing. Verify error toast, no partial data, form preservation.
6. **Flow 6 (Mobile):** Test on 375px viewport (iPhone SE). Verify button visibility, touch targets, cross-section field population.
7. **Flow 7 (Multiple Rounds):** Two consecutive dictation rounds. Verify merge behavior.

Additional edge cases:
- Very short recording (< 1 second)
- Very long recording (> 2 minutes)
- Dictation in edit mode (existing record with pre-filled fields)
- Rapid button tapping (start/stop quickly)
- Browser without MediaRecorder support (should degrade gracefully)

**Acceptance Criteria:**
- [ ] All 7 product flows pass manual testing
- [ ] Edge cases handled gracefully with Spanish error messages
- [ ] No console errors during any flow
- [ ] Works on Chrome, Safari (desktop + mobile viewport)
- [ ] `bun run build` passes
- [ ] `bun run lint` passes
- [ ] Dark mode tested for all button states

**Estimated Effort:** M

**Dependencies:** DICT-005, DICT-006 (all implementation complete)

---

## 5. Integration Points

### MedicalRecordForm Integration

The primary integration point is modifying `src/components/medical-records/medical-record-form.tsx`. The changes are additive:

1. **Import additions:** `useDictation` hook, `DictationButton` component
2. **Hook instantiation:** Call `useDictation({ customFieldNames })` inside the component
3. **Header modification:** Add DictationButton to `DialogHeader` flex container
4. **Field merge handler:** New `useCallback` that iterates over extracted fields and calls `form.setValue()`
5. **Plan gating wrapper:** Check `tenant.billing_plan` before allowing `startRecording()`

No existing functionality is modified or removed. The form continues to work identically without dictation.

### AI Config Integration

The new files import from `src/lib/ai/config.ts` (existing):
- `openai` provider instance for transcription model
- `model` for GPT-4o-mini extraction
- `MAX_RETRIES`, `RETRY_DELAY_MS`, `delay` for retry logic

No modifications to `config.ts` are needed.

### Type System Integration

New types are appended to `src/types/app.ts` in a new section. No existing types are modified. The `ExtractedMedicalFields` shape deliberately mirrors `MedicalRecordFormValues` to make the merge logic straightforward.

---

## 6. Testing Strategy

Per project testing standard: **manual testing only**. No automated test framework is configured.

### Pre-Commit Checklist

For each ticket:
1. `bun run build` -- must pass with zero errors
2. `bun run lint` -- must pass with zero warnings/errors
3. Manual browser test on Chrome desktop
4. Manual browser test on mobile viewport (375px width)

### Dictation-Specific Test Matrix

| Scenario | Desktop Chrome | Mobile Safari (viewport) | Expected Result |
|----------|---------------|-------------------------|-----------------|
| Full happy path dictation | Test | Test | All fields populated |
| Partial dictation (2 fields) | Test | Test | Only mentioned fields changed |
| Permission denied | Test | Test | Spanish error toast |
| Network failure mid-processing | Test | -- | Error toast, form preserved |
| Short recording (< 1s) | Test | Test | "Grabacion muy corta" error |
| Multiple rounds | Test | Test | Merge without clearing |
| BASIC plan user | Test | -- | Upgrade toast |
| Edit mode with existing data | Test | Test | Merge preserves unmentioned |
| Dark mode all states | Test | -- | Colors correct |

---

## 7. Cross-Cutting Concerns

### Error Handling Strategy

All errors surface as Spanish-language toast notifications via Sonner. Error categories:

| Error Type | Message | Recovery |
|------------|---------|----------|
| Microphone permission denied | "No se pudo acceder al microfono. Verifica los permisos de tu navegador." | Button returns to idle |
| No microphone found | "No se encontro un microfono. Conecta uno e intenta de nuevo." | Button returns to idle |
| Recording too short | "La grabacion fue muy corta. Intenta de nuevo." | Button returns to idle |
| Transcription failure | "Error al transcribir el audio. Por favor intenta de nuevo." | Button returns to idle |
| Extraction failure | "Error al procesar la dictacion. Por favor intenta de nuevo." | Button returns to idle |
| Network failure | "Error de conexion. Verifica tu internet e intenta de nuevo." | Button returns to idle |
| Audio too large | "El audio es demasiado largo. Intenta con una grabacion mas corta." | Button returns to idle |
| Plan restriction | "La dictacion por IA esta disponible en el plan Pro." | Button remains idle (no recording started) |

**Critical rule:** No partial data is ever written to the form on error. The merge happens only after both transcription AND extraction succeed.

### Loading States

- **Recording:** Pulsing animation + duration timer. Form remains interactive.
- **Processing:** Spinner + "Procesando..." label. Button disabled. Form remains interactive (doctor can manually edit other fields).
- Transitions between states are immediate (no artificial delays).

### Accessibility

- DictationButton uses semantic HTML `<button>` element.
- `aria-label` changes per state: "Iniciar dictado", "Detener grabacion", "Procesando dictado".
- Recording state includes `aria-live="polite"` for the duration counter.
- Color is not the sole indicator of state -- icons change between Mic, Square, and Spinner.

### Performance

- Audio blobs are created in memory, sent, and discarded. No persistent storage.
- The API route processes audio sequentially (transcribe -> extract). Total processing time depends on audio length but should be < 15 seconds for a 30-second recording per product spec.
- No impact on initial page load -- the hook and component are lazy-loaded within the form modal.

### Security

- Audio is never persisted to disk or database.
- The API route runs server-side; the OpenAI API key is never exposed to the client.
- Audio is sent over HTTPS to the Next.js API route, then from the server to OpenAI's API.
- No PII is logged. Only `console.error` for failure diagnostics.

---

## 8. Deployment Plan

### Environment Variables

No new environment variables required. The existing `OPENAI_API_KEY` (used by `src/lib/ai/config.ts`) is sufficient for both Whisper and GPT-4o-mini.

### Database Migrations

None required. No new tables, columns, or RLS policies.

### Dependencies

No new npm packages required. All functionality is covered by existing dependencies:
- `ai` (^6.0.78) -- `experimental_transcribe`, `generateText`, `Output`
- `@ai-sdk/openai` (^3.0.26) -- `openai.transcription()`, `openai()` model
- `framer-motion` (^12.34.0) -- pulse animation
- `lucide-react` (^0.563.0) -- Mic, Square, Loader2 icons
- `sonner` (^2.0.7) -- toast notifications
- `zod` (^4.3.6) -- schema validation

### Feature Flags

None. The feature is gated by billing plan (PRO/ENTERPRISE/TRIAL_ACTIVE), not a feature flag.

### Rollout Strategy

Local development only (per project constraints). Deploy when all 7 tickets pass manual testing.

---

## 9. Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| `experimental_transcribe` API changes in future AI SDK versions | Build break | Medium | Pin `ai` version. The function is stable in v6 despite the `experimental_` prefix. Monitor Vercel AI SDK changelog. |
| Whisper accuracy for Latin American Spanish medical terminology | Incorrect field values | Low-Medium | Set `language: 'es'` explicitly. The system prompt for extraction adds a second layer of interpretation. Doctor reviews all fields before saving. |
| GPT-4o-mini misclassifying which field content belongs to | Wrong field populated | Medium | System prompt must include clear field definitions with examples. `null` for unmentioned fields prevents spurious data. Doctor always reviews. |
| MediaRecorder not supported on older browsers | Feature unavailable | Low | Check `navigator.mediaDevices` and `MediaRecorder` existence. Show a graceful "Tu navegador no soporta grabacion de audio" message. MediaRecorder is supported in all modern browsers (Chrome 47+, Firefox 25+, Safari 14.1+). |
| Large audio files causing slow processing | Poor UX | Low | Product spec says typical dictation is 30 seconds (< 15s processing). 2-minute max is ~1.5MB webm which is well under the 25MB limit. |
| OpenAI API rate limits or downtime | Feature temporarily unavailable | Low | Existing retry logic in `config.ts` (3 retries with exponential backoff). Error message tells doctor to try again. |

### Escalation Criteria

- If `experimental_transcribe` is removed in a future AI SDK update, the implementation must be refactored to use the raw `openai` npm package directly for Whisper calls.
- If GPT-4o-mini extraction accuracy is insufficient for medical field mapping, consider upgrading to `gpt-4o` for the extraction step (higher cost but better accuracy).

---

## 10. Assumptions

1. The `openai.transcription('whisper-1')` provider from `@ai-sdk/openai` v3.x supports the `language` option via `providerOptions`. If not, the language hint can be omitted (Whisper auto-detects Spanish well).
2. `audio/webm;codecs=opus` is the primary recording format. This is supported by Chrome, Edge, and Safari 14.1+. Firefox uses `audio/ogg;codecs=opus` as fallback. Both are accepted by OpenAI Whisper.
3. The medical record form modal is always rendered client-side (it has `'use client'` directive), so browser APIs (MediaRecorder, navigator.mediaDevices) are available.
4. The `form` instance from `useForm()` is accessible in the component scope where the dictation integration happens (it is -- the form is created at line 193 of the existing component).
