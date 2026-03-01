# Testing Standard

## Current State
No test framework configured. Testing is manual.

## Recommended Setup (Future)
- **Vitest** for unit tests
- **Playwright** for E2E tests
- **Testing Library** for component tests

## Manual Testing Checklist

### Before Committing
1. Run `bun run build` - must pass
2. Run `bun run lint` - must pass
3. Test feature in browser (desktop + mobile)

### Critical Paths to Test
- Authentication flow (signup, login, logout)
- Patient CRUD operations
- Appointment scheduling
- Medical record creation
- Billing/checkout flow

---

## DOs
- Test on Chrome and Safari
- Test responsive design (mobile breakpoint: 768px)
- Verify RLS policies with different user roles

## DON'Ts
- Do NOT deploy without build passing
- Do NOT skip linting
- Do NOT assume server actions work without testing
