# AI Dictation Interpretation for Medical Records

**GitHub Issue:** #1  
**Repo:** quamidev/MidiMedV2

## Summary
Allow doctors to dictate notes during appointment completion. AI transcribes the audio and auto-fills the medical record form fields.

## How it works
1. Microphone button in the medical record form
2. Doctor speaks freely (symptoms, vitals, prescriptions, etc.)
3. Audio sent to OpenAI Whisper for transcription
4. Transcript sent to GPT-4o-mini to extract structured fields
5. Form auto-populated — doctor reviews and saves

## Scope
- New API route: `/api/ai/dictation`
- New hook: `use-dictation`
- New component: `DictationButton`
- Integrated into `medical-record-form`
- Responsive: mobile + desktop

## Notes
- Uses existing OpenAI key flow (`src/lib/ai/config.ts`)
- PR targets `development` branch
