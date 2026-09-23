# Testing strategy

## Pyramid

1. **Unit (Vitest + Testing Library):** progress derivation (`done/total`, weighted project),
   permission helpers (`requirePermission` matrix), Zod validators, date/status transitions.
   Target: meaningful coverage on `server/` + `lib/`, not vanity %.
2. **Integration:** Drizzle queries against ephemeral Supabase branch; RLS policy tests per role
   (member A vs B isolation, VIEWER write-denied, audit append-only).
3. **E2E (Playwright):** login → overview → create/assign/transition task → milestone progress
   updates → VIEWER denial → mobile drawer (390px) → CMD+K search → audit row appears.
4. **A11y:** axe in CI + manual keyboard pass (focus visible, ARIA, contrast, reduced-motion).
5. **Security:** `npm audit`, semgrep/gitleaks in GHA; required checks before prod promote.

## Gates (every phase)

```
npm run lint && npm run typecheck && npm run test && npm run build
npx playwright test (smoke) · visual inspect · responsive 390/768/1280 · authZ + RLS checks
```

## Layout

`/e2e/*.spec.ts`, `/__tests__/**/*.test.ts`, `playwright.config.ts` (baseURL localhost + `roadmapchurch.crdo.site` smoke post-deploy).
