# AO-007, AO-008, AO-009 -- UI Display Components

## Summary

Implemented the UI display layer for the Appointment Outcomes feature. This adds visual indicators for `no_show` and `rescheduled` appointment statuses across three key surfaces: patient profile, dashboard, and reports.

## What Was Implemented

### AO-007: Status Badges in Patient Appointments
- Removed the local `AppointmentStatus` type alias from `patient-appointments.tsx` and imported the canonical type from `@/types/app`.
- Added `UserX` and `RefreshCw` icon imports from `lucide-react`.
- Extended `statusConfig` with two new entries: `no_show` (amber, "No Show") and `rescheduled` (slate, "Reprogramada").
- Removed the unnecessary `as AppointmentStatus` cast since the type now matches.
- Also fixed type completeness in `appointment-popup.tsx`, `mobile-appointment-list.tsx`, and `notification-item.tsx` which had incomplete `Record<AppointmentStatus, ...>` and `Record<NotificationType, ...>` mappings after AO-002 expanded those union types.

### AO-008: No-Shows Stat Card on Dashboard
- Added `UserX` icon import and `noShowCount` state variable to `QuickStats`.
- Modified the existing `getAppointments` fetch for today to also filter and count `no_show` appointments.
- Added a "No-shows hoy" stat card (amber color) as the second card in the stats array.
- Changed "Esta semana" card color from amber to blue to differentiate it from the no-show card.
- Updated grid layout from `sm:grid-cols-3` to `sm:grid-cols-2 lg:grid-cols-4` for 4 cards.
- Updated skeleton loader to render 4 placeholder cards.

### AO-009: No-Show KPI Card and Rate on Reports Page
- Added `UserX` icon import and `noShowAppointments` to the stats state object.
- Added filtering logic to count `no_show` appointments in `fetchData`.
- Added a "No-shows" KPI card (amber) to the grid.
- Updated grid from `lg:grid-cols-4` to `lg:grid-cols-3 xl:grid-cols-5` for 5 cards.
- Added a no-show rate summary bar below the KPI cards showing percentage when data is available.

## Key Technical Decisions

- Reused the same amber color palette (`text-amber-500`, `bg-amber-500/10`) across all three no-show indicators for visual consistency.
- Used slate palette for `rescheduled` status to keep it visually neutral.
- The no-show count on the dashboard piggybacks on the existing `getAppointments` call for today (no extra network request).
- The no-show rate on reports uses integer rounding via `Math.round()` for clean display.

## Files Modified

| File | Ticket | Changes |
|------|--------|---------|
| `src/components/patients/patient-appointments.tsx` | AO-007 | Imported `AppointmentStatus` type, added `UserX`/`RefreshCw` icons, extended `statusConfig` |
| `src/components/appointments/appointment-popup.tsx` | AO-007 | Added `no_show`/`rescheduled` to `statusConfig` |
| `src/components/appointments/mobile-appointment-list.tsx` | AO-007 | Added `no_show`/`rescheduled` to `statusIcons` |
| `src/components/notifications/notification-item.tsx` | AO-007 | Added `appointment_no_show`/`appointment_rescheduled` to icon and color maps |
| `src/app/(protected)/dashboard/page.tsx` | AO-008 | Added no-show stat card, updated grid layout to 4 columns |
| `src/app/(protected)/reports/page.tsx` | AO-009 | Added no-show KPI card, no-show rate summary, updated grid to 5 columns |
| `tsconfig.json` | Build fix | Excluded `purple/` and `supabase/` dirs from TypeScript compilation (pre-existing build issue) |

## Testing Performed

- `npm run build` passes successfully.
- `npm run lint` shows only pre-existing warnings/errors unrelated to these changes.
- TypeScript type checking confirms zero new errors.

## Deviations from Spec

- Fixed three additional files (`appointment-popup.tsx`, `mobile-appointment-list.tsx`, `notification-item.tsx`) that had incomplete type mappings after AO-002 expanded the `AppointmentStatus` and `NotificationType` union types. These were not in the ticket scope but were necessary for the build to pass.
- Added `purple/` and `supabase/` directories to `tsconfig.json` exclude list to fix a pre-existing build failure caused by `playwright` and Deno imports in non-application files.
