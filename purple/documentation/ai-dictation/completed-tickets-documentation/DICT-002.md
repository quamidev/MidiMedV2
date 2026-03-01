# DICT-002: AI Dictation API Route

## What Was Implemented

Built the server-side dictation pipeline as two files: `src/lib/ai/dictation-extract.ts` for GPT-4o-mini structured field extraction, and `src/app/api/ai/dictation/route.ts` for the POST endpoint that accepts multipart/form-data audio, transcribes via OpenAI Whisper (`experimental_transcribe` from the `ai` package), and returns extracted `ExtractedMedicalFields` conforming to the Zod schema from DICT-001. The API validates audio file presence, size (25MB max), and MIME type before processing. All error messages are in Spanish. Optional `customFieldNames` parameter allows tenant-specific field extraction into the `extras` object.

## Key Technical Decisions

- Used `experimental_transcribe` from `ai` with `openai.transcription('whisper-1')` and `providerOptions.openai.language: 'es'` for Spanish transcription, following the latest Vercel AI SDK documentation.
- Used `generateObject` from `ai` with the Zod schema for type-safe structured extraction, consistent with the existing `appointment-summary.ts` pattern.
- Audio is passed as `Uint8Array` directly to the transcribe function (not wrapped in an object with `type`/`data` fields) per the current AI SDK v6 API.
- MIME type validation strips codec suffixes (e.g., `audio/webm;codecs=opus` becomes `audio/webm`) with a nullish coalescing fallback for TypeScript strict mode.

## Files Created

- `src/lib/ai/dictation-extract.ts` - Medical field extraction logic with system prompt
- `src/app/api/ai/dictation/route.ts` - POST handler with validation, transcription, and extraction

## Testing Performed

- TypeScript type-check (`tsc --noEmit`): passes with zero errors
- ESLint (`npm run lint`): no new warnings or errors from the dictation files
- Build (`npm run build`): TypeScript compilation succeeds; build data-collection step fails on pre-existing `supabaseUrl` env var issue in unrelated webhook route

## Known Limitations

- No authentication/authorization check on the endpoint (could be added if needed for production)
- No retry logic on the transcription step (unlike the appointment-summary which has retry logic); the extraction step also does not retry. This keeps the implementation simpler and avoids long request times.
- The `experimental_transcribe` API is still experimental in the Vercel AI SDK
