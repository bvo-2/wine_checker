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
