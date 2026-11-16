# Decant — progress log

## Phase 0 — Audit and plan

- **Built:** `docs/PLAN.md` (audit of the old Next.js app, confirmed stack, data model, folder structure, routing choice, phases, risks).
- **Tested:** nothing to test; no app code changed in this phase.
- **Decisions by the owner:** replace the Next.js / SQLite / WineAPI app with a static React + Vite app; build all phases in one run.
- **Open:** the design system document is still to be uploaded.

## Phase 1 — Foundation

- **Built:** Vite + React 18 + strict TypeScript project; ESLint, Prettier, Vitest, Playwright (phone 375px and desktop 1280px projects) and a GitHub Actions workflow. Design tokens (`src/styles/tokens.css`), self-hosted Fraunces and Crimson Text, global styles. App shell: top bar with logo and name, product tabs, menu sheet, skip link, footer, hash routing with placeholder pages, 404 page, error boundary. Components: Button, IconButton, Badge, TextInput (with TextArea and Select), ProductTabs, Modal, EmptyState, Icon.
- **Tested:** component tests for every component state; a unit test that fails if a component stylesheet contains a raw colour or pixel value; E2E smoke test (tabs, menu sheet, 404, fonts loaded with no external requests, sub-path hosting) with axe.
- **Limitations:** tokens come from the previous app's CSS until the design system document is added to the repo.

## Later (ideas, not built)

- Wine lookup from an external API (needs a proxy for secret keys).
- Bottle photos.
- Clean URLs (history routing) once the hosting is known.
