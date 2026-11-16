# Decant — plan

Written in Phase 0 after auditing the repository. It records what was found, the decisions taken and the phase list.

## 1. Audit: what was in the repo

| Area                   | Found                                                                                                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App                    | A Next.js 16 / React 19 app ("Decant — wine checker"), about 1,800 lines.                                                                                   |
| Storage                | Server-side SQLite through `node:sqlite` (`lib/db.ts`), written by server actions.                                                                          |
| External services      | WineAPI search and wine details (`lib/wineapi.ts`), key injected by the server.                                                                             |
| Design                 | `app/tokens.css` and `app/globals.css`, an implementation of the Decant design system (Bordeaux palette, Fraunces + Crimson Text loaded from Google Fonts). |
| Tests                  | None. No lint config, no CI. Only `tsc --noEmit`.                                                                                                           |
| Docs                   | `README.md`. No `docs/` folder. The logo was at `public/decant-logo.png`.                                                                                   |
| Design system document | `docs/design/Decant-design-system.md` was **not** in the repo (see open questions).                                                                         |

### Why the existing stack is replaced

The brief says to keep an existing stack where possible. Here it can't be kept: the old app needs a Node server (server actions, SQLite) and an external API, and the brief requires a static, server-less app with browser storage and no external APIs. The owner agreed to replace it. What is carried over is the visual language: the token values and component styles from the old CSS.

Data in an old local `dev.db` file is not migrated (it was git-ignored and only ever existed on a developer machine).

## 2. Confirmed stack

| Area                   | Choice                                                                                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Language               | TypeScript, strict                                                                                                                                         |
| Front end              | React 18 + Vite, single-page app, static output in `dist/`                                                                                                 |
| Routing                | React Router 6 with **hash routing** (see section 5)                                                                                                       |
| Styling                | CSS custom properties (`src/styles/tokens.css`) + CSS modules. A unit test fails the build if a component stylesheet contains a raw colour or pixel value. |
| Validation             | Zod, for every form and for imported backup files                                                                                                          |
| Storage                | IndexedDB through Dexie, versioned schema, behind repository interfaces                                                                                    |
| Unit / component tests | Vitest + Testing Library + `fake-indexeddb`                                                                                                                |
| End-to-end             | Playwright, phone and desktop projects, against the production build                                                                                       |
| Accessibility          | `@axe-core/playwright` on every page                                                                                                                       |
| CI                     | GitHub Actions: lint, type-check, unit tests, build, E2E on each pull request                                                                              |

Dependencies beyond the brief's list, each needed by a stated requirement:

- `@fontsource-variable/fraunces`, `@fontsource/crimson-text` — the font files, bundled so the app works offline.
- ESLint plugins, Prettier, `jsdom`, `@testing-library/*` — tooling for the listed lint and test stack.

The service worker is hand-written (about 50 lines, generated at build time by a small Vite plugin in `vite.config.ts`), so no PWA library is added.

## 3. Data model

As in the brief, unchanged:

```ts
type WineType = 'red' | 'white' | 'rose' | 'orange' | 'sparkling' | 'dessert';

interface Wine {
  id: string; // uuid
  name: string; // required, ≤ 200 chars
  producer?: string;
  vintage?: number; // 1800–current year
  region?: string;
  country?: string; // ISO 3166-1 alpha-2
  type?: WineType;
  grapes?: string[];
  abv?: number; // 0–25
  createdAt: string;
  updatedAt: string; // ISO timestamps
}

interface Rating {
  id: string;
  wineId: string;
  stars: 1 | 2 | 3 | 4 | 5;
  note?: string; // ≤ 2000 chars
  pricePaid?: number;
  currency?: string; // ISO 4217 code
  place?: string;
  tastedOn: string; // YYYY-MM-DD, not in the future
  createdAt: string;
  updatedAt: string;
}
```

IndexedDB database `decant`, schema version 1:

| Table     | Key and indexes                                       | Holds                                                   |
| --------- | ----------------------------------------------------- | ------------------------------------------------------- |
| `wines`   | `id`, `name`, `producer`, `region`, `country`, `type` | Wine records                                            |
| `ratings` | `id`, `wineId`, `tastedOn`                            | Tasting records                                         |
| `meta`    | `key`                                                 | Small settings, e.g. the date of the last backup export |

Rules:

- Any later change to these shapes is a new Dexie version with an upgrade function and a test that upgrades data written by the previous version (`src/data/migrations.test.ts`).
- The backup file carries its own `formatVersion`, checked on import.
- Deleting a wine deletes its ratings in the same transaction, after confirmation.
- Duplicates (same name + producer + vintage, ignoring case and extra spaces) are only ever _suggested_, never merged.

## 4. Folder structure

```
docs/               PLAN.md, PROGRESS.md, design/ (design system, logo)
public/             icons, web app manifest
src/
  styles/           tokens.css, global.css (fonts, reset, type styles)
  components/       design-system components, one folder each (tsx, module.css, test)
  domain/           pure logic: types, Zod schemas, stats, duplicates, grouping, countries, formatting
  data/             Dexie database, repositories, backup export/import, React hooks
  app/              shell: top bar, menu sheet, error boundary, router
  pages/            one file per screen
e2e/                Playwright tests
```

The UI only talks to the repository interfaces in `src/data/repositories.ts`. To move storage to a server later, write a second implementation of those interfaces; screens do not change.

## 5. Routing choice

**Hash routing** (`/#/wines/abc`). Reasons: it works on any static host with no server configuration, from a domain root or from a sub-path, and offline. The build uses relative asset paths (`base: './'`), so the same `dist/` folder works at any URL.

Trade-off: URLs contain `#`. If clean URLs are wanted later, switch `HashRouter` to `BrowserRouter` in `src/app/App.tsx`, set Vite's `base` to the real path, and configure the server to answer unknown paths with `index.html`.

## 6. Phases

Unchanged from the brief. The owner asked for all phases to be built in one run without review stops, delivered as small commits on one branch.

| Phase | Scope                                                                             |
| ----- | --------------------------------------------------------------------------------- |
| 0     | This audit and plan                                                               |
| 1     | Foundation: tooling, CI, tokens, fonts, shell, routing, base components           |
| 2     | Storage layer, add + rate flow, My cellar                                         |
| 3     | Wine detail, edit, delete, duplicate suggestion, sort and filter                  |
| 4     | Wineries, Regions, Countries, Tastings                                            |
| 5     | Offline (PWA), backup export/import, storage safety, Lighthouse, deployment notes |

## 7. Open questions and risks

| #   | Item                                                                                  | Status                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `Decant-design-system.md` is missing from the repo.                                   | Owner will upload it. Until then, tokens and component styles are carried over from the previous app's CSS, which implemented that document. Reconcile when it arrives. |
| 2   | Browser storage can be evicted (private mode, low disk, "clear site data").           | Mitigated in Phase 5: persistent-storage request, backup export and a reminder after 30 days.                                                                           |
| 3   | A real-phone check can't be done from the build environment.                          | Emulated phone in Playwright; the owner does the real-device check (steps in the README).                                                                               |
| 4   | Future external APIs that need a secret key can't be called safely from a static app. | Out of scope now. Would need a small proxy server at that time.                                                                                                         |
