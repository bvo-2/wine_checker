# Decant — progress log

## Phase 0 — Audit and plan

- **Built:** `docs/PLAN.md` (audit of the old Next.js app, confirmed stack, data model, folder structure, routing choice, phases, risks).
- **Tested:** nothing to test; no app code changed in this phase.
- **Decisions by the owner:** replace the Next.js / SQLite / WineAPI app with a static React + Vite app; build all phases in one run.
- **Open at the time:** the design system document was still to be uploaded (it arrived during Phase 5).

## Phase 1 — Foundation

- **Built:** Vite + React 18 + strict TypeScript project; ESLint, Prettier, Vitest, Playwright (phone 375px and desktop 1280px projects) and a GitHub Actions workflow. Design tokens (`src/styles/tokens.css`), self-hosted Fraunces and Crimson Text, global styles. App shell: top bar with logo and name, product tabs, menu sheet, skip link, footer, hash routing with placeholder pages, 404 page, error boundary. Components: Button, IconButton, Badge, TextInput (with TextArea and Select), ProductTabs, Modal, EmptyState, Icon.
- **Tested:** component tests for every component state; a unit test that fails if a component stylesheet contains a raw colour or pixel value; E2E smoke test (tabs, menu sheet, 404, fonts loaded with no external requests, sub-path hosting) with axe.
- **Limitations at the time:** tokens came from the previous app's CSS because the design system document was not yet in the repo. Resolved in the alignment pass below.

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

## Phase 5 — Offline, backup, ready for a server

- **Built:**
  - PWA: web app manifest with the logo, and a hand-written service worker (`src/sw.template.js`, filled in by a small plugin in `vite.config.ts`) that stores every file of the app, so it opens and works with no connection.
  - Backup page: Export downloads a versioned JSON file (`formatVersion: 1`). Import validates the whole file with Zod first, shows how many wines and tastings it holds and exactly what merge or replace would do, then asks for confirmation. Merge adds what is new and updates a record only if the file's copy is newer; replace is destructive and says so. An invalid file is rejected with a message and nothing changes. An import runs in one transaction: all or nothing.
  - Storage safety: asks for persistent storage on start; shows the browser's answer on the Backup page; a dismissible reminder when the last export (or, with none, the oldest wine) is over 30 days old.
  - README: how to build, what to upload, what the host needs.
- **Tested:** unit tests for the backup format (round trip, corrupt and foreign files, newer version, duplicates, orphan tastings), import planning, transactional import and the reminder rule; component tests for export, import (merge, replace, rejections) and the reminder; E2E for export → clear → import, replace with confirmation, corrupt-file rejection, fully offline use after the first load, installability, and offline from a sub-path.
- **Lighthouse (mobile, production build, local):**

  | Page               | Performance | Accessibility | Best practices |
  | ------------------ | ----------- | ------------- | -------------- |
  | My cellar (`/`)    | 96          | 100           | 100            |
  | Add a wine         | 98          | 100           | 100            |
  | Backup and restore | 98          | 100           | 100            |

- **Found while testing:**
  - The offline cache missed the app's script and stylesheet when the server sent `Vary: Origin`. The cache lookup now ignores `Vary`.
  - A colour transition on buttons could be caught half-way by the contrast check. Removed; the design system allows opacity and shadow transitions only.
- **Limitations:**
  - Not checked on a real phone (steps are in the README).
  - A new version takes effect the next time the app is opened after it was fully closed.
  - Lighthouse was run on pages without stored data; it cannot seed IndexedDB.
  - `npm audit` reports two moderate advisories in React Router 6 (fixed only in 7.18): one concerns server rendering, which this app does not use; the other concerns link targets built from untrusted text. Here link targets are built from record ids, and imported ids are now restricted to letters, digits, `-` and `_`. Moving to React Router 7 would clear the report; it is a major-version change, so it is left as a decision.

## Design system alignment

Done when `docs/design/Decant-design-system.md` was added to the repo.

- **Changed to match the document:** complete type tokens (including per-style tracking); Button gains `pill` and loses hover colour shifts; IconButton variants are `circle` (32px, default), `outline` (40px), `ghost`; ProductTabs takes `tabs`, `active`, `onChange`, `label` and supports `isNew` and `icon`; CategoryStrip takes `items` and defaults to the six wine types; WineCard uses the documented props (`title`, `wine`, `price`, `ratingCount`, `image`, `saved`, `onSave`…) with a 4:5 plate; Rating is one component (`size`, `readOnly`, `showValue`) whose stars are buttons with spoken labels; RatingDisplay is flat and centred; ReviewCard has the author row, small stars, a three-line clamp and "Show more", with no card surface; TextInput labels are `muted`.
- **Layout:** product tabs centred in the top bar and moved into the menu sheet below 744px; card grid 4 / 2 / 1 columns at the documented breakpoints; wine page capped at 1080px in two columns (64 / 32) with the rating sticky on the right; wine name in `display-lg`.
- **Where the build brief overrides the document:** fonts are self-hosted, not loaded from Google Fonts (offline requirement); the logo in the top bar is 48px, not 40px (the brief's minimum); SearchBar is not built.
- **Extensions beyond the document** (each marked "App extension" in the code): a `danger` button for confirming a deletion (the document has no destructive style; it uses `error`, never `primary`); `href` on product tabs so they are real links; `to` and `ratingLabel` on WineCard; `error`, `required`, `disabled` on Rating; `hideAvatar`, `authorHref`, `actions`, `level` on ReviewCard; `hint` and `optional` on TextInput, plus TextArea and Select in the same style; extra icons (plus, menu, edit, trash, download, upload, check, chevron); Modal, ConfirmDialog and EmptyState.
- **Judgement calls worth a look:**
  - Mobile shows one card per row, as the document says. With bottle silhouettes instead of photos this makes a long list; two per row would be denser.
  - ReviewCard is a "community" component with an avatar. For my own tastings the avatar is hidden, and the name line carries the date (wine page) or the wine (Tastings page).
  - The top bar's "Add a wine" is a secondary button so each screen keeps a single primary action.

## Later (ideas, not built)

- Wine lookup from an external API (needs a proxy for secret keys).
- Bottle photos.
- Clean URLs (history routing) once the hosting is known.
