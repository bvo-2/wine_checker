# Decant

A personal app for rating wines and keeping a cellar of what I've tasted. It is a static single-page app: no accounts, no server, no external services. All data is stored in the browser on the device.

See `docs/PLAN.md` for the architecture and `docs/PROGRESS.md` for what has been built.

## Develop

Requires Node.js 20.19 or later.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Command             | What it does                                                              |
| ------------------- | ------------------------------------------------------------------------- |
| `npm run lint`      | ESLint and Prettier check                                                 |
| `npm run typecheck` | TypeScript, strict                                                        |
| `npm test`          | Unit and component tests (Vitest)                                         |
| `npm run build`     | Production build into `dist/`                                             |
| `npm run e2e`       | Playwright tests against the production build (run `npm run build` first) |
| `npm run check`     | All of the above, in order                                                |

The first time you run the E2E tests on a new machine, install the browser with `npx playwright install chromium`.
