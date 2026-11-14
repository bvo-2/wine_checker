# Decant — wine checker

Find a bottle, rate it, keep a cellar of what you loved.

A Next.js app for saving and rating wines. It looks wines up in [WineAPI](https://wineapi.io), stores your cellar, ratings and tasting notes in a local SQLite file, and is styled with the Decant design system (Bordeaux palette, Fraunces + Crimson Text).

## Features

- **Find wines**: search WineAPI by name, producer or appellation, then save a result with the heart.
- **Wine detail**: bottle shot, appellation, grapes, body and acidity, food pairings, critic scores and prices, where WineAPI has them.
- **Rate**: tap a star to save a 1–5 rating, then add a tasting note.
- **My cellar**: everything you saved, filterable by wine type and sortable by recent, rating or name.
- **Add a wine**: add a bottle by hand when it isn't in the catalogue.

## Run it locally

Requires Node.js 22.13 or later. It uses the built-in `node:sqlite`, so there are no native database dependencies.

```bash
npm install
cp .env.example .env.local   # then put your WineAPI key in WINEAPI_KEY
npm run dev                  # http://localhost:3000
```

| Variable | Purpose |
|---|---|
| `WINEAPI_KEY` | Your key from https://wineapi.io/dashboard/keys, sent as `X-API-Key`. Never commit it. |
| `DATABASE_URL` | SQLite file, default `file:./dev.db` (git-ignored). |

In the Claude cloud environment (`wine_checker`), the network proxy injects the WineAPI key, so `WINEAPI_KEY` can stay unset there. The npm scripts set `NODE_USE_ENV_PROXY=1` so that Node's `fetch` goes through that proxy. Locally it has no effect.

## Layout

```
app/
  tokens.css        Decant design tokens (CSS custom properties)
  globals.css       Type styles and dc-* component styles
  actions.ts        Server actions: save, remove, rate, note, add
  page.tsx          My cellar
  search/           WineAPI search
  wines/[id]/       Wine detail and rating
  wines/new/        Add a wine by hand
public/decant-logo.png  Logo (also app/icon.png, app/apple-icon.png)
components/         TopBar, SearchBar, CategoryStrip, WineCard, Rating, RatingDisplay, Icon
lib/
  db.ts             SQLite storage (wines, ratings)
  wineapi.ts        WineAPI client (search, details)
```

Drink responsibly.
