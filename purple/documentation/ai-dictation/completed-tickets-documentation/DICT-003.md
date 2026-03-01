# DICT-003: Build the useDictation Hook

## What Was Implemented

Created `src/hooks/use-dictation.ts`, a React hook that encapsulates the full voice dictation lifecycle: microphone permission requests, audio recording via the MediaRecorder API, communication with the `/api/ai/dictation` endpoint, and returning extracted `ExtractedMedicalFields` for form population. The hook manages status transitions through `idle -> recording -> processing -> idle/error`, exposes a real-time `recordingDuration` counter, and provides `startRecording`, `stopRecording`, and `cancelRecording` controls. All user-facing error messages are in Spanish, and the hook auto-recovers from error state back to idle after 3 seconds.

## Key Technical Decisions

- Used `useRef` for MediaRecorder, audio chunks, stream, and timers to avoid stale closures in callbacks -- consistent with how the existing `use-notifications.ts` hook manages mutable state.
- Extracted error-with-recovery logic into a `setErrorWithRecovery` helper to eliminate duplication of the `setTimeout(() => setStatus('idle'), 3000)` pattern across multiple error paths.
- Used `ReturnType<typeof setInterval>` for timer refs instead of `NodeJS.Timeout` to ensure compatibility across environments (browser vs Node type definitions).
- Extracted magic numbers into named constants (`MIN_RECORDING_SECONDS`, `ERROR_RECOVERY_DELAY_MS`, `DATA_COLLECTION_INTERVAL_MS`, `DURATION_TICK_INTERVAL_MS`) for clarity and maintainability.
- The `stopRecording` function returns a Promise that resolves inside the `MediaRecorder.onstop` callback, bridging the event-based MediaRecorder API with async/await callers.
- Cleanup of the error recovery timer on unmount prevents state updates on unmounted components.

## Files Created

- `src/hooks/use-dictation.ts` - The useDictation hook

## Testing Performed

- TypeScript type-check (`tsc --noEmit`): passes with zero errors
- ESLint (`npx eslint src/hooks/use-dictation.ts`): no warnings or errors
- ESLint on full hooks directory: no warnings or errors

## Known Limitations

- The hook does not enforce a maximum recording duration (could be added if needed for cost control on the transcription API).
- Browser compatibility depends on MediaRecorder support; the `getSupportedMimeType` function tries multiple MIME types but Safari support varies.
- No retry logic on the API call; a single network failure will show an error and require the user to re-record.
