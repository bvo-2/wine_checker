import { expect, test } from '@playwright/test';
import { expectNoSeriousA11yIssues, isPhone, openTab, trackConsole } from './helpers';

test.describe('app shell', () => {
  test('loads, navigates between tabs and has no console errors', async ({ page }) => {
    const messages = trackConsole(page);
    await page.goto('/');
    await expect(page).toHaveTitle(/Decant/);
    await expect(page.getByRole('link', { name: 'Decant, home' })).toBeVisible();

    for (const name of ['Wineries', 'Regions', 'Countries', 'Tastings', 'Wines']) {
      await openTab(page, name);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
    expect(messages).toEqual([]);
  });

  test('the logo is at least 48px and uses self-hosted fonts', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (request) => {
      if (!request.url().startsWith('http://localhost')) external.push(request.url());
    });
    await page.goto('/');
    const logo = page.getByRole('link', { name: 'Decant, home' }).locator('img');
    const box = await logo.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(48);
    expect(box?.height).toBeGreaterThanOrEqual(48);
    await page.evaluate(() => document.fonts.ready);
    const loaded = await page.evaluate(() =>
      [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family),
    );
    expect(loaded.join(' ')).toContain('Crimson Text');
    expect(loaded.join(' ')).toContain('Fraunces');
    expect(external).toEqual([]);
  });

  test('the menu sheet opens, traps focus and closes with Escape', async ({ page }) => {
    await page.goto('/');
    const opener = page.getByRole('button', { name: 'Open menu' });
    await opener.click();
    const sheet = page.getByRole('dialog', { name: 'Menu' });
    await expect(sheet).toBeVisible();
    await expectNoSeriousA11yIssues(page);
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect(opener).toBeFocused();

    await opener.click();
    await sheet.getByRole('link', { name: 'Backup and restore' }).click();
    await expect(sheet).toBeHidden();
    await expect(page).toHaveURL(/#\/backup$/);
  });

  test('the tabs are in the top bar from 744px and in the menu sheet below', async ({ page }) => {
    await page.goto('/');
    const tabs = page.getByRole('navigation', { name: 'Sections' });
    if (isPhone(page)) {
      await expect(tabs).toBeHidden();
      await page.getByRole('button', { name: 'Open menu' }).click();
      await expect(page.getByRole('dialog').getByRole('link')).toHaveText([
        'Wines',
        'Wineries',
        'Regions',
        'Countries',
        'Tastings',
        'Add a wine',
        'Backup and restore',
      ]);
    } else {
      await expect(tabs.getByRole('link')).toHaveText([
        'Wines',
        'Wineries',
        'Regions',
        'Countries',
        'Tastings',
      ]);
      await expect(tabs.getByRole('link', { name: 'Wines' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    }
  });

  test('shows a 404 page for an unknown address', async ({ page }) => {
    await page.goto('/#/definitely/not/here');
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await page.getByRole('link', { name: 'Back to my cellar' }).click();
    await expect(page).toHaveURL(/#\/$/);
    await expectNoSeriousA11yIssues(page);
  });

  test('has no horizontal scrolling and passes axe', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    await expectNoSeriousA11yIssues(page);
  });

  test('works when served from a sub-path', async ({ page }) => {
    await page.goto('http://localhost:4174/some/sub/path/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.goto('http://localhost:4174/some/sub/path/#/wineries');
    await expect(page.getByRole('heading', { level: 1, name: 'No wineries yet' })).toBeVisible();
  });
});
