# DICT-001: Define Dictation Types and Zod Schemas

## What was implemented

Established the shared type contract for the AI dictation feature by adding TypeScript interfaces and Zod schemas that will be consumed by the API route and client hook.

Three interfaces were appended to `src/types/app.ts`: `ExtractedVitals` (nullable vital sign fields), `ExtractedMedicalFields` (all structured fields extractable from voice dictation), and `DictationApiResponse` (discriminated union for API success/error responses). A new file `src/lib/ai/dictation-schemas.ts` was created containing corresponding Zod schemas with `.describe()` annotations that guide the LLM during structured extraction. The schemas use nullable fields throughout so that "not mentioned" data is represented as `null` rather than omitted.

## Key technical decisions

- All fields are nullable (not optional) to distinguish "not mentioned" from "empty", aligning with the overwrite-only-if-present pattern.
- `medications` is typed as `string | null` (newline-separated) rather than `string[]` to match the textarea format used in the medical record form.
- The `extras` field uses `Record<string, string>` for custom tenant fields, keeping values as plain strings for form compatibility.
- Zod `.describe()` annotations include Spanish-language examples to improve LLM extraction accuracy for Latin American medical dictation.

## Files created or modified

- `src/types/app.ts` -- Added `ExtractedVitals`, `ExtractedMedicalFields`, and `DictationApiResponse` types (updated changelog header).
- `src/lib/ai/dictation-schemas.ts` -- New file with `extractedVitalsSchema`, `extractedMedicalFieldsSchema` Zod schemas and `ExtractedMedicalFieldsFromSchema` inferred type.

## Testing performed

- `npx tsc --noEmit` -- passes with zero errors.
- `npx eslint src/types/app.ts src/lib/ai/dictation-schemas.ts` -- passes with zero errors.
- `npm run build` has a pre-existing failure unrelated to these changes (missing server-reference-manifest for `finish-sign-in` page).

## Known limitations

- None for this ticket. The types and schemas are purely declarative and ready to be consumed by DICT-002 (API route) and DICT-003 (client hook).
