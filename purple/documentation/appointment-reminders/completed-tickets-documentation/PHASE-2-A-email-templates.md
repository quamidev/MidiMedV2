# PHASE-2-A: Email Template Builder Functions

**Ticket:** PHASE-2-A
**Status:** Completed
**Date:** 2026-03-01
**Implementer:** Claude Opus 4.6

---

## What Was Implemented

Created two HTML email template builder functions (`build24hReminderEmail` and `build2hReminderEmail`) plus two subject-line helper functions (`get24hSubject` and `get2hSubject`) in a single shared module. The functions accept a `ReminderEmailData` object (patient name, appointment date as ISO string, provider name, clinic name) and return complete HTML document strings ready to be sent via the Resend API. All email content is in Spanish (Latin American). Dates are formatted using `Intl.DateTimeFormat` with the `es` locale, producing output like "martes, 3 de marzo de 2026 a las 10:00 AM". The HTML uses table-based layout with inline styles for broad email client compatibility (Gmail, Outlook, Apple Mail). The brand color `#0d9488` is applied to the header and accent elements. The module is pure TypeScript with zero external dependencies.

## Key Technical Decisions

- **Template literals over JSX/React Email:** The implementation spec explicitly calls for template literals instead of React Email, since the Edge Function runs on Deno and JSX compilation adds unnecessary complexity. Template literals also make the module dependency-free.
- **Composable builder functions:** The HTML is built from small composable functions (`buildHeader`, `buildGreetingAndMessage`, `buildAppointmentCard`, `buildFooter`) to keep each function under 50 lines and maintain readability while avoiding code duplication between the two email variants.
- **HTML escaping:** An `escapeHtml` utility protects against HTML injection in dynamic values (patient names, provider names, clinic names) by escaping `&`, `<`, `>`, `"`, and `'`.
- **MSO conditional comments:** Outlook-specific conditional comments (`<!--[if mso]>`) ensure the 600px fixed width is respected in Microsoft Outlook clients that do not support `max-width` CSS.
- **AM/PM normalization:** The `Intl.DateTimeFormat` output for `es` locale uses `a. m.` / `p. m.` notation. The formatter normalizes this to uppercase `AM` / `PM` for cleaner presentation.
- **Unicode escapes in template strings:** Spanish characters with diacritics (mana, comunicquese, etc.) are written as Unicode escapes (`\u00f1`, `\u00ed`, `\u00fa`, `\u00e1`, `\u00f3`) in the source code to avoid encoding issues across different editors and runtimes.

## Files Created

| File | Purpose |
|------|---------|
| `supabase/functions/appointment-reminders/_templates/reminder-email.ts` | Email template builder module with all exported functions and the `ReminderEmailData` interface |

## Deviations from Spec

None. The implementation matches all acceptance criteria from the ticket.

## Testing Performed

- Ran a verification script that invoked both builder functions and both subject-line functions with sample data.
- Validated 21 automated checks covering: DOCTYPE presence, table layout usage, brand color, patient/provider/clinic name inclusion, inline styles, 600px width, Arial font, `lang="es"` attribute, absence of flexbox/grid/style blocks, correct Spanish copy for both tone variants, and date formatting.
- Visually inspected the full rendered HTML output for both templates.
- Confirmed the date "martes, 3 de marzo de 2026 a las 10:00 AM" is correct for the input `2026-03-03T10:00:00-06:00` (March 3, 2026 is indeed a Tuesday).
- Confirmed `npm run build` and `npm run lint` show no new errors (pre-existing errors in other files are unrelated).

## Known Limitations

- **Timezone display:** As noted in the implementation spec, dates are formatted using the runtime's local timezone via `Intl.DateTimeFormat`. In production on the Deno Edge Function, this will be UTC. The implementation spec documents this as a V1 simplification, with a future enhancement to add per-tenant timezone configuration.
- **No dark mode support:** Email clients with dark mode may invert colors. This is acceptable for V1 as noted in the spec.
