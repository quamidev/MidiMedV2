# DICT-006: Framer Motion Recording Pulse Animation

## What Was Implemented

Enhanced the existing `DictationButton` component's recording-state pulse animation with three targeted improvements: (1) increased the scale keyframe from `[1, 1.2, 1]` to `[1, 1.3, 1]` for a more visually distinctive pulsing ring, (2) added the `will-change-transform` CSS class to the `motion.div` element for GPU-composited rendering on mobile devices, and (3) introduced explicit z-index layering (`z-0` on the pulse, `z-10` on the Button) to guarantee the pulse renders behind the interactive button in all stacking contexts.

## Key Technical Decisions

- Used Tailwind's `z-0` / `z-10` utility classes rather than inline styles or arbitrary values, staying consistent with the project's styling standard that prohibits inline styles and arbitrary values.
- The `will-change-transform` hint is applied only to the pulse element (which is conditionally rendered during recording), so the browser's compositor optimization is scoped and does not affect layout performance when the animation is inactive.
- The existing animation properties (1.5s duration, infinite repeat, easeInOut easing, `bg-destructive/20` color) were already correct per the ticket spec and were preserved unchanged.

## Files Modified

- `src/components/medical-records/dictation-button.tsx` -- Updated pulse animation scale, added `will-change-transform` and z-index layering, added changelog entry in file header.

## Testing Performed

- **TypeScript compilation**: `next build` compiled successfully (runtime failure is a pre-existing missing Supabase env var, unrelated to this change).
- **Linting**: `eslint` reports zero errors or warnings for `dictation-button.tsx`.

## Known Limitations

- The `will-change-transform` class is a hint to the browser and its effect varies by device; on very old mobile browsers it may be ignored without functional impact.
