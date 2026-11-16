import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/** Fails if axe finds serious or critical accessibility issues on the current page. */
export async function expectNoSeriousA11yIssues(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(
    serious.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`),
  ).toEqual([]);
}

/** Collects console errors and warnings so a test can assert there were none. */
export function trackConsole(page: Page): string[] {
  const messages: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') messages.push(msg.text());
  });
  page.on('pageerror', (error) => messages.push(String(error)));
  return messages;
}

export function isPhone(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1280) < 744;
}

export interface SeedWine {
  id: string;
  name: string;
  producer?: string;
  vintage?: number;
  region?: string;
  country?: string;
  type?: string;
}
export interface SeedRating {
  id: string;
  wineId: string;
  stars: number;
  tastedOn: string;
  note?: string;
  place?: string;
}

/** Writes records straight into IndexedDB, then reloads so the app shows them. */
export async function seed(page: Page, wines: SeedWine[], ratings: SeedRating[]) {
  await page.goto('/');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.evaluate(
    async ([wines, ratings]) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('decant');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const tx = db.transaction(['wines', 'ratings'], 'readwrite');
      const stamp = '2025-01-01T00:00:00.000Z';
      for (const wine of wines) {
        tx.objectStore('wines').put({ ...wine, createdAt: stamp, updatedAt: stamp });
      }
      for (const rating of ratings) {
        const at = `${rating.tastedOn}T12:00:00.000Z`;
        tx.objectStore('ratings').put({ ...rating, createdAt: at, updatedAt: at });
      }
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    },
    [wines, ratings] as const,
  );
  await page.reload();
}

export const SAMPLE_WINES: SeedWine[] = [
  {
    id: 'w1',
    name: 'Barolo Monfortino',
    producer: 'Giacomo Conterno',
    vintage: 2015,
    region: 'Piedmont',
    country: 'IT',
    type: 'red',
  },
  {
    id: 'w2',
    name: 'Chablis Les Clos',
    producer: 'Raveneau',
    vintage: 2019,
    region: 'Burgundy',
    country: 'FR',
    type: 'white',
  },
  {
    id: 'w3',
    name: 'Albariño',
    producer: 'Pazo Señorans',
    vintage: 2022,
    region: 'Rías Baixas',
    country: 'ES',
    type: 'white',
  },
  { id: 'w4', name: 'House red' },
];
export const SAMPLE_RATINGS: SeedRating[] = [
  {
    id: 'r1',
    wineId: 'w1',
    stars: 5,
    tastedOn: '2025-03-01',
    note: 'Roses and tar.',
    place: 'At home',
  },
  { id: 'r2', wineId: 'w1', stars: 4, tastedOn: '2024-11-20' },
  { id: 'r3', wineId: 'w2', stars: 4, tastedOn: '2025-06-10' },
  { id: 'r4', wineId: 'w3', stars: 3, tastedOn: '2025-02-14' },
  { id: 'r5', wineId: 'w4', stars: 2, tastedOn: '2025-06-01', place: 'Bistro' },
];
