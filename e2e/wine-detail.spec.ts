import { expect, test, type Page } from '@playwright/test';
import {
  expectNoSeriousA11yIssues,
  SAMPLE_RATINGS,
  SAMPLE_WINES,
  seed,
  trackConsole,
} from './helpers';

test.beforeEach(async ({ page }) => {
  await seed(page, SAMPLE_WINES, SAMPLE_RATINGS);
});

const cards = (page: Page) => page.getByRole('main').getByRole('heading', { level: 3 });

test.describe('wine detail, edit, delete', () => {
  test('add a tasting → the average updates', async ({ page }) => {
    const messages = trackConsole(page);
    await page.getByRole('link', { name: /Barolo Monfortino/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Barolo Monfortino' })).toBeVisible();
    const rating = page.getByRole('complementary', { name: 'My rating' });
    await expect(rating).toContainText('4.5');
    await expect(rating).toContainText('Average of 2 tastings');
    await expectNoSeriousA11yIssues(page);

    await page.getByRole('link', { name: 'Add another tasting' }).click();
    await expectNoSeriousA11yIssues(page);
    await page.getByRole('radio', { name: '3 stars' }).check({ force: true });
    await page.getByLabel('Tasting note').fill('Past its best.');
    await page.getByRole('button', { name: 'Save tasting' }).click();

    await expect(rating).toContainText('4.0');
    await expect(rating).toContainText('Average of 3 tastings');
    await expect(page.getByText('Past its best.')).toBeVisible();
    await page.reload();
    await expect(rating).toContainText('Average of 3 tastings');
    expect(messages).toEqual([]);
  });

  test('edit a wine and a tasting', async ({ page }) => {
    await page.goto('/#/wines/w2');
    await page.getByRole('link', { name: 'Edit wine' }).click();
    await expect(page.getByLabel('Wine name')).toHaveValue('Chablis Les Clos');
    await expectNoSeriousA11yIssues(page);
    await page.getByLabel('Wine name').fill('Chablis Grand Cru Les Clos');
    await page.getByLabel('Vintage').fill('2020');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Chablis Grand Cru Les Clos' }),
    ).toBeVisible();
    await expect(page.getByText('2020 · White')).toBeVisible();

    await page.getByRole('link', { name: /Edit tasting of 10 June 2025/ }).click();
    await expect(page.getByRole('radio', { name: '4 stars' })).toBeChecked();
    await page.getByRole('radio', { name: '5 stars' }).check({ force: true });
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('complementary', { name: 'My rating' })).toContainText('5.0');
  });

  test('delete a tasting and a wine, each only after confirmation', async ({ page }) => {
    await page.goto('/#/wines/w1');
    await page.getByRole('button', { name: /Delete tasting of 20 November 2024/ }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    await expectNoSeriousA11yIssues(page);
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Average of 2 tastings')).toBeVisible();

    await page.getByRole('button', { name: /Delete tasting of 20 November 2024/ }).click();
    await dialog.getByRole('button', { name: 'Delete tasting' }).click();
    await expect(page.getByRole('complementary', { name: 'My rating' })).toContainText('5.0');
    await expect(page.getByRole('heading', { name: '20 November 2024' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Delete wine' }).click();
    await expect(dialog).toContainText('Barolo Monfortino and its 1 tasting will be deleted');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('heading', { level: 1, name: 'Barolo Monfortino' })).toBeVisible();

    await page.getByRole('button', { name: 'Delete wine' }).click();
    await dialog.getByRole('button', { name: 'Delete wine' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'My cellar' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Barolo Monfortino/ })).toHaveCount(0);
    await page.reload();
    await expect(page.getByText('3 wines')).toBeVisible();
    await page.goto('/#/wines/w1');
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  });

  test('suggests the existing wine when adding a duplicate', async ({ page }) => {
    await page.goto('/#/wines/new');
    await page.getByLabel('Wine name').fill('  barolo   MONFORTINO');
    await page.getByLabel('Producer').fill('giacomo conterno');
    await page.getByLabel('Vintage').fill('2015');
    await page.getByRole('radio', { name: '2 stars' }).check({ force: true });
    await page.getByRole('button', { name: 'Save to my cellar' }).click();

    const notice = page.getByRole('group', { name: 'You already have this wine' });
    await expect(notice).toBeVisible();
    await expect(notice).toBeFocused();
    await expectNoSeriousA11yIssues(page);
    await notice.getByRole('button', { name: 'Add tasting to existing wine' }).click();

    await expect(page).toHaveURL(/#\/wines\/w1$/);
    await expect(page.getByText('Average of 3 tastings')).toBeVisible();
    await page.goto('/#/');
    await expect(page.getByText('4 wines')).toBeVisible();
  });

  test('sort and filter the cellar', async ({ page }) => {
    await expect(cards(page)).toHaveText([
      'Chablis Les Clos',
      'House red',
      'Barolo Monfortino',
      'Albariño',
    ]);
    await page.getByLabel('Sort by').selectOption('Highest rated');
    await expect(cards(page)).toHaveText([
      'Barolo Monfortino',
      'Chablis Les Clos',
      'Albariño',
      'House red',
    ]);
    await page.getByLabel('Sort by').selectOption('Name (A to Z)');
    await expect(cards(page)).toHaveText([
      'Albariño',
      'Barolo Monfortino',
      'Chablis Les Clos',
      'House red',
    ]);

    const filter = page.getByRole('group', { name: 'Filter by wine type' });
    await filter.getByRole('button', { name: 'White' }).click();
    await expect(cards(page)).toHaveText(['Albariño', 'Chablis Les Clos']);
    await expect(page.getByText('2 of 4 wines')).toBeVisible();
    await expect(page).toHaveURL(/type=white/);
    await expectNoSeriousA11yIssues(page);

    await page.reload();
    await expect(cards(page)).toHaveText(['Albariño', 'Chablis Les Clos']);

    await filter.getByRole('button', { name: 'Sparkling' }).click();
    await expect(page.getByRole('heading', { name: 'No sparkling wines yet' })).toBeVisible();
    await page.getByRole('button', { name: 'Show all wines' }).click();
    await expect(page.getByText('4 wines', { exact: true })).toBeVisible();
  });
});
