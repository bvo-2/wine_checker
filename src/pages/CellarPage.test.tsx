import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { createTestRepositories } from '../data/testing';
import { renderApp } from '../test/render';

describe('My cellar', () => {
  it('invites me to add my first wine when empty', async () => {
    renderApp('/');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Your cellar is empty' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add your first wine' })).toHaveAttribute(
      'href',
      '/wines/new',
    );
  });

  it('lists wines by most recent tasting, showing the latest rating', async () => {
    const { repos } = createTestRepositories();
    const old = await repos.wines.createWithRating(
      { name: 'Old favourite', type: 'red' },
      { stars: 5, tastedOn: '2024-01-01' },
    );
    await repos.wines.createWithRating({ name: 'Newcomer' }, { stars: 3, tastedOn: '2025-06-01' });
    await repos.ratings.create(old.wine.id, { stars: 2, tastedOn: '2024-03-01' });

    renderApp('/', repos);
    await screen.findByRole('heading', { level: 1, name: 'My cellar' });
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Newcomer',
      'Old favourite',
    ]);
    expect(screen.getByText('2 wines')).toBeInTheDocument();
    const oldCard = screen.getByRole('link', { name: /Old favourite/ });
    expect(oldCard).toHaveTextContent('2.0');
    expect(oldCard).toHaveAttribute('href', `/wines/${old.wine.id}`);
    expect(screen.getByText('2 tastings')).toBeInTheDocument();
  });

  it('updates by itself when a wine is added elsewhere', async () => {
    const { repos } = renderApp('/');
    await screen.findByRole('heading', { level: 1, name: 'Your cellar is empty' });
    await repos.wines.createWithRating({ name: 'Surprise' }, { stars: 4, tastedOn: '2025-01-01' });
    expect(await screen.findByRole('heading', { level: 3, name: 'Surprise' })).toBeInTheDocument();
  });
});
