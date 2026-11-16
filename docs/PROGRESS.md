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

## Phase 2 — Add, rate, cellar

- **Built:** Dexie database `decant` (schema version 1) behind `WineRepository` and `RatingRepository` (`src/data/repositories.ts`); screens read through `useLive`, which refreshes when stored data changes. Zod validation for the wine and tasting forms and for stored records. "Add a wine" page: wine and first tasting saved together in one transaction; only name and stars are required; less-used fields sit under "More details", which opens by itself if it contains an error. "My cellar" (Wines tab): WineCard grid, most recent tasting first, latest rating on each card, empty state. Components: Rating (radio-group star input), RatingStars, WineCard with bottle silhouette in the wine type's colour.
- **Tested:** unit tests for validation (boundaries for vintage, ABV, price, note length, dates), repositories (create, update, cascade delete, all-or-nothing save, reopen), a schema migration harness, cellar sorting; component tests for the form and cellar; E2E add → rate → cellar → reload, validation messages, and a keyboard-only run.
- **Limitations:** a wine can be added but not yet opened, edited or deleted (Phase 3).

## Phase 3 — Wine detail, edit, delete

- **Built:** wine detail page (RatingDisplay with the average of my tastings, facts, tastings as ReviewCards newest first); add another tasting; edit a wine; edit or delete a tasting; delete a wine with its tastings. Every delete asks first (ConfirmDialog, an alert dialog where Cancel is the first button). Duplicate suggestion on "Add a wine": same name + producer + vintage, ignoring case and extra spaces, offers "Add tasting to existing wine" or "Save as a new wine"; nothing is merged automatically. Cellar sorting (recent, rating, name) and wine-type filter (CategoryStrip), both kept in the URL.
- **Tested:** unit tests for average-rating maths and duplicate matching; component tests for RatingDisplay, ReviewCard, CategoryStrip, ConfirmDialog and each page flow; E2E for add tasting → average updates, edit, delete with confirmation, duplicate suggestion, sort and filter.
- **Limitations:** deleting is permanent (no undo); the backup in Phase 5 is the safety net.

## Phase 4 — Browse by Wineries, Regions, Countries, Tastings

- **Built:** Wineries, Regions and Countries tabs: lists grouped from my own wines with wine count, tasting count and my average rating (the mean of every tasting in the group), sorted by name or rating. Spellings that differ only in case or spacing share a group; wines missing the field are under "Unknown", always last. Each group opens the cellar filtered to it, with a link back. Tastings tab: every tasting newest first under month headings, each linking to its wine. Empty states for all four tabs.
- **Tested:** unit tests for grouping (missing values, merged spellings, order-independent labels, tasting-weighted average, month grouping); component tests for each tab; E2E navigating every tab with seeded data, plus empty states.
- **Found while testing:** the label of a merged group depended on the order the browser returned the wines in. Fixed: the most used spelling wins, then the one with more capitals.

## Later (ideas, not built)

- Wine lookup from an external API (needs a proxy for secret keys).
- Bottle photos.
- Clean URLs (history routing) once the hosting is known.
