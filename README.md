# Decant

A personal app for rating wines and keeping a cellar of what I've tasted.

It is a static single-page app: no accounts, no server, no external services. All data is stored in the browser, on the device. It works offline and can be installed on a phone's home screen.

- `docs/PLAN.md` — architecture, data model and decisions
- `docs/PROGRESS.md` — what was built in each phase, and how it was tested
- `docs/design/Decant-design-system.md` — the design system the app follows

## What it does

- **Add a wine and rate it** in one step: only the name and 1–5 stars are required.
- **My cellar** (Wines tab): every wine with my latest rating; sort by recent, rating or name; filter by wine type.
- **Wine page**: my average rating, the wine's details and every tasting. Add another tasting, edit, or delete (always with confirmation).
- **Duplicate suggestion**: adding a wine with the same name, producer and vintage offers to add the tasting to the existing wine instead. Nothing is merged automatically.
- **Wineries, Regions, Countries**: my wines grouped from my own data, with counts and average rating.
- **Tastings**: every tasting by date, grouped by month.
- **Backup and restore** (in the menu): export everything to a JSON file; import a file by merging or replacing.

## Develop

Requires Node.js 20.19 or later.

```bash
npm install
```

```bash
npm run dev
```

The app opens at http://localhost:5173.

| Command             | What it does                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------- |
| `npm run lint`      | ESLint and Prettier check                                                                    |
| `npm run typecheck` | TypeScript, strict                                                                           |
| `npm test`          | Unit and component tests (Vitest)                                                            |
| `npm run build`     | Production build into `dist/`                                                                |
| `npm run e2e`       | Playwright tests (phone and desktop) against the production build; run `npm run build` first |
| `npm run check`     | All of the above, in order                                                                   |

The first time you run the end-to-end tests on a machine, install the browser:

```bash
npx playwright install chromium
```

Offline mode (the service worker) only exists in the production build. To try it locally:

```bash
npm run build
```

```bash
npm run preview
```

## Put it on a server (later)

Nothing is deployed by this repository. When you are ready:

1. Run `npm run build`.
2. Upload **everything inside `dist/`** to any static file host: `index.html`, `sw.js`, `manifest.webmanifest`, and the `assets/` and `icons/` folders.

What the host needs:

| Need                        | Why                                                                                                                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **HTTPS**                   | Browsers only allow offline mode, installing to the home screen and persistent storage on secure pages. (`localhost` is the one exception.)                                               |
| Nothing for routing         | The app uses hash routing (`/#/wines/…`), so every address is served by `index.html`. No rewrite or fallback rule is needed.                                                              |
| Any folder                  | Asset paths are relative, so the same `dist/` works at a domain root (`https://example.com/`) or in a sub-path (`https://example.com/decant/`). Both are covered by the end-to-end tests. |
| `sw.js` not cached for long | Serve `sw.js` and `index.html` with `Cache-Control: no-cache` if the host lets you choose. Files in `assets/` have a content hash in their name and can be cached forever.                |

Updating: upload a new build over the old one. The app picks it up the next time it is opened after all its tabs (or the installed app) were closed.

**Your data is tied to the address.** Browser storage belongs to one origin (scheme + domain + port). If you move the app to a different domain, export a backup at the old address first and import it at the new one.

## Your data

- Stored in IndexedDB in this browser, on this device only. Nothing is sent anywhere.
- Clearing site data, or using a private window, removes or hides it. Export a backup regularly; the app reminds you when the last one is more than 30 days old.
- The app asks the browser for persistent storage so the data is not evicted when the device runs low on space. The Backup page shows whether the browser agreed.
- Changes to the stored data shape go through versioned migrations (`src/data/db.ts`), each with a test.

## Check on a real phone

This could not be done from the build environment, so it is the one manual check left:

1. Serve the production build over HTTPS (or deploy it), and open it in the phone's browser.
2. Add a wine with a rating; confirm it appears in the cellar and is still there after closing and reopening the browser.
3. Use the browser's "Add to Home Screen" / "Install app"; open Decant from the icon.
4. Turn on aeroplane mode; open Decant and add another wine.
5. In the menu, open Backup and restore; export a backup and check that the file is saved.

## Project layout

```
docs/               plan, progress log, design system and logo
public/             icons and web app manifest
src/
  styles/           design tokens and global styles
  components/       design-system components (one folder each, with tests)
  domain/           pure logic: validation, averages, duplicates, grouping, backup format
  data/             IndexedDB (Dexie) behind repository interfaces
  app/              shell: top bar, menu sheet, routing, error boundary
  pages/            one file per screen
  sw.template.js    the service worker, filled in at build time
e2e/                Playwright tests
```
