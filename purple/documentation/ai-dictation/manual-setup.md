# Manual Setup Required

**Feature:** AI Dictation for Medical Records
**Date:** 2026-02-28

## Checklist

Use this checklist to complete the manual setup for this feature.

### Environment Variables

- [ ] `OPENAI_API_KEY` - Ensure this is configured in `.env.local` and your deployment environment (Vercel). This key is already used by existing AI features (patient summary, appointment summary), so it should already be set. No new environment variables are required.

### Third-Party Services

- [ ] **OpenAI API Access** - Verify your OpenAI account has access to:
  - `whisper-1` model (for audio transcription)
  - `gpt-4o-mini` model (for field extraction)

  Both models should be available on standard OpenAI API accounts.

### Browser Requirements

- [ ] **Microphone Permissions** - Users must grant microphone access in their browser for dictation to work. The app will prompt for permissions automatically.

- [ ] **Supported Browsers** - Ensure users are on supported browsers:
  - Chrome 47+ (recommended)
  - Firefox 25+
  - Safari 14.1+
  - Edge 79+

### Plan Gating

- [ ] **Verify Plan Access** - Dictation is available to:
  - PRO plan users
  - ENTERPRISE plan users
  - TRIAL users with `TRIAL_ACTIVE` status

  BASIC plan users will see an upgrade prompt when attempting to use dictation.

### Testing Checklist

Before deploying, manually verify:

- [ ] Open the medical record form (complete an appointment or create a new record)
- [ ] Verify the dictation button appears in the form header (microphone icon)
- [ ] Test recording: tap to start, speak in Spanish, tap to stop
- [ ] Verify fields are populated correctly after processing
- [ ] Test error handling: deny microphone permission, verify error message appears
- [ ] Test plan gating: log in as BASIC user, verify upgrade prompt appears

### Database / Firebase

No database changes required. No new tables, columns, or indexes needed.

### DNS / Domain

No DNS or domain configuration required.

### Cron Jobs / Scheduled Tasks

No scheduled tasks required for this feature.

---

**Note:** This feature uses ephemeral audio processing. Audio recordings are never stored - they are transcribed in real-time and discarded after processing.
