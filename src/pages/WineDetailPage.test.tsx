import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Repositories } from '../data/repositories';
import { createTestRepositories } from '../data/testing';
import type { Wine } from '../domain/types';
import { renderApp } from '../test/render';

let repos: Repositories;
let wine: Wine;

beforeEach(async () => {
  repos = createTestRepositories().repos;
  ({ wine } = await repos.wines.createWithRating(
    {
      name: 'Barolo',
      producer: 'Conterno',
      vintage: 2015,
      region: 'Piedmont',
      country: 'IT',
      type: 'red',
      grapes: ['Nebbiolo'],
      abv: 14.5,
    },
    {
      stars: 5,
      tastedOn: '2025-03-01',
      note: 'Superb',
      place: 'At home',
      pricePaid: 120,
      currency: 'EUR',
    },
  ));
  await repos.ratings.create(wine.id, { stars: 4, tastedOn: '2024-11-20' });
});

describe('Wine detail', () => {
  it('shows the average, the facts and my tastings newest first', async () => {
    renderApp(`/wines/${wine.id}`, repos);
    expect(await screen.findByRole('heading', { level: 1, name: 'Barolo' })).toBeInTheDocument();
    const rating = screen.getByRole('complementary', { name: 'My rating' });
    expect(within(rating).getByText('4.5')).toBeInTheDocument();
    expect(within(rating).getByText('Average of 2 tastings')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      '1 March 2025',
      '20 November 2024',
    ]);
    expect(screen.getByText('At home · €120.00')).toBeInTheDocument();
    const about = screen.getByRole('region', { name: 'About this wine' });
    expect(
      within(about)
        .getAllByRole('definition')
        .map((d) => d.textContent),
    ).toEqual(['Conterno', '2015', 'Red', 'Piedmont', 'Italy', 'Nebbiolo', '14.5 %']);
  });

  it('shows a 404 page for a wine that does not exist', async () => {
    renderApp('/wines/nope', repos);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument();
  });

  it('adds another tasting and updates the average', async () => {
    renderApp(`/wines/${wine.id}`, repos);
    await userEvent.click(await screen.findByRole('link', { name: 'Add another tasting' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Add a tasting' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '3 stars' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save tasting' }));
    expect(await screen.findByText('Average of 3 tastings')).toBeInTheDocument();
    expect(screen.getByText('4.0', { selector: 'p' })).toBeInTheDocument();
  });

  it('edits a tasting', async () => {
    renderApp(`/wines/${wine.id}`, repos);
    await userEvent.click(
      await screen.findByRole('link', { name: 'Edit tasting of 1 March 2025' }),
    );
    const note = await screen.findByLabelText(/Tasting note/);
    expect(note).toHaveValue('Superb');
    expect(screen.getByRole('button', { name: '5 stars' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.clear(note);
    await userEvent.type(note, 'Even better on day two');
    await userEvent.click(screen.getByRole('button', { name: '4 stars' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    // selector: the note on the detail page, not the textarea still on screen while saving.
    expect(
      await screen.findByText('Even better on day two', { selector: 'p' }),
    ).toBeInTheDocument();
    expect(screen.getByText('4.0', { selector: 'p' })).toBeInTheDocument();
    expect(await repos.ratings.list()).toHaveLength(2);
  });

  it('deletes a tasting only after confirmation', async () => {
    renderApp(`/wines/${wine.id}`, repos);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Delete tasting of 20 November 2024' }),
    );
    const dialog = screen.getByRole('alertdialog', { name: 'Delete this tasting?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(await repos.ratings.list()).toHaveLength(2);

    await userEvent.click(
      screen.getByRole('button', { name: 'Delete tasting of 20 November 2024' }),
    );
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete tasting' }),
    );
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(await screen.findByText('My rating', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('5.0', { selector: 'p' })).toBeInTheDocument();
    expect(await repos.ratings.list()).toHaveLength(1);
    expect(await repos.wines.list()).toHaveLength(1);
  });

  it('keeps the wine, unrated, when its last tasting is deleted', async () => {
    const lone = await repos.wines.createWithRating(
      { name: 'Lone' },
      { stars: 2, tastedOn: '2025-01-01' },
    );
    renderApp(`/wines/${lone.wine.id}`, repos);
    await userEvent.click(await screen.findByRole('button', { name: /Delete tasting/ }));
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete tasting' }),
    );
    expect(
      await screen.findByText('No tastings yet. Add one to rate this wine.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Not rated yet')).toBeInTheDocument();
  });

  it('edits the wine', async () => {
    renderApp(`/wines/${wine.id}`, repos);
    await userEvent.click(await screen.findByRole('link', { name: 'Edit wine' }));
    const name = await screen.findByLabelText('Wine name');
    expect(name).toHaveValue('Barolo');
    expect(screen.getByLabelText(/Country/)).toHaveValue('IT');
    await userEvent.clear(name);
    await userEvent.type(name, 'Barolo Riserva');
    await userEvent.clear(screen.getByLabelText(/Region/));
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Barolo Riserva' }),
    ).toBeInTheDocument();
    const stored = await repos.wines.get(wine.id);
    expect(stored?.region).toBeUndefined();
    expect(stored?.producer).toBe('Conterno');
    expect(await repos.ratings.listForWine(wine.id)).toHaveLength(2);
  });

  it('validates the edit form', async () => {
    renderApp(`/wines/${wine.id}/edit`, repos);
    await userEvent.clear(await screen.findByLabelText('Wine name'));
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(screen.getByLabelText('Wine name')).toHaveAccessibleDescription(
      'Enter the name of the wine',
    );
    expect((await repos.wines.get(wine.id))?.name).toBe('Barolo');
  });

  it('deletes the wine and its tastings only after confirmation', async () => {
    const other = await repos.wines.createWithRating(
      { name: 'Keeper' },
      { stars: 3, tastedOn: '2025-01-01' },
    );
    renderApp(`/wines/${wine.id}`, repos);
    await userEvent.click(await screen.findByRole('button', { name: 'Delete wine' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Delete this wine?' });
    expect(dialog).toHaveTextContent('Barolo and its 2 tastings will be deleted for good');
    await userEvent.keyboard('{Escape}');
    expect(await repos.wines.list()).toHaveLength(2);

    await userEvent.click(screen.getByRole('button', { name: 'Delete wine' }));
    await userEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete wine' }),
    );
    expect(await screen.findByRole('heading', { level: 1, name: 'My cellar' })).toBeInTheDocument();
    expect(await repos.wines.list()).toEqual([other.wine]);
    expect(await repos.ratings.list()).toEqual([other.rating]);
  });

  it('does not open a tasting through another wine', async () => {
    const other = await repos.wines.createWithRating(
      { name: 'Other' },
      { stars: 3, tastedOn: '2025-01-01' },
    );
    renderApp(`/wines/${wine.id}/tastings/${other.rating.id}/edit`, repos);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeInTheDocument();
  });
});
