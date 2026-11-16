import { expect, test } from '@playwright/test';
import { expectNoSeriousA11yIssues, trackConsole } from './helpers';

test.describe('add, rate, cellar', () => {
  test('add a wine → rate it → see it in the cellar → reload → still there', async ({ page }) => {
    const messages = trackConsole(page);
    await page.goto('/');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Your cellar is empty' }),
    ).toBeVisible();
    await expectNoSeriousA11yIssues(page);

    await page.getByRole('link', { name: 'Add your first wine' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Add a wine' })).toBeVisible();
    await expectNoSeriousA11yIssues(page);

    await page.getByLabel('Wine name').fill('Barolo Monfortino');
    await page.getByLabel('Producer').fill('Giacomo Conterno');
    await page.getByLabel('Vintage').fill('2015');
    await page.getByLabel('Type').selectOption('Red');
    await page.getByRole('radio', { name: '5 stars' }).check({ force: true });
    await page.getByLabel('Tasting note').fill('Roses, tar and a very long finish.');
    await page.getByRole('button', { name: 'Save to my cellar' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'My cellar' })).toBeVisible();
    const card = page.getByRole('link', { name: /Barolo Monfortino/ });
    await expect(card).toBeVisible();
    await expect(card).toContainText('5.0');
    await expect(card).toContainText('Giacomo Conterno');
    await expect(card).toContainText('2015 · Red');
    await expectNoSeriousA11yIssues(page);

    await page.reload();
    await expect(page.getByRole('link', { name: /Barolo Monfortino/ })).toBeVisible();
    await expect(page.getByText('1 wine', { exact: true })).toBeVisible();
    expect(messages).toEqual([]);
  });

  test('validation messages appear for bad input and nothing is saved', async ({ page }) => {
    await page.goto('/#/wines/new');
    await page.getByRole('button', { name: 'Save to my cellar' }).click();
    await expect(page.getByText('Enter the name of the wine')).toBeVisible();
    await expect(page.getByText('Choose a rating from 1 to 5 stars')).toBeVisible();
    await expect(page.getByLabel('Wine name')).toBeFocused();
    await expectNoSeriousA11yIssues(page);

    await page.getByLabel('Wine name').fill('Chablis');
    await page.getByLabel('Vintage').fill('1066');
    await page.getByText('More details').click();
    await page.getByLabel('Alcohol').fill('99');
    await page.getByText('More details').click();
    await page.getByRole('radio', { name: '3 stars' }).check({ force: true });
    await page.getByRole('button', { name: 'Save to my cellar' }).click();
    await expect(page.getByText(/Enter a year from 1800/)).toBeVisible();
    // The section holding the second message was closed; it opens by itself.
    await expect(page.getByText('Enter a strength from 0 to 25 %')).toBeVisible();
    await expect(page).toHaveURL(/#\/wines\/new$/);

    await page.goto('/#/');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Your cellar is empty' }),
    ).toBeVisible();
  });

  test('the whole flow works with the keyboard only', async ({ page }) => {
    await page.goto('/#/wines/new');
    await page.getByLabel('Wine name').focus();
    await page.keyboard.type('Keyboard Riesling');
    // Tab through producer, vintage and type to the stars.
    for (let i = 0; i < 4; i += 1) await page.keyboard.press('Tab');
    await expect(page.getByRole('radio', { name: '1 star', exact: true })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('radio', { name: '4 stars' })).toBeChecked();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('link', { name: /Keyboard Riesling/ })).toContainText('4.0');
  });
});
