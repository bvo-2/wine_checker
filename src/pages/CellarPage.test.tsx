import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

describe('My cellar: sort and filter', () => {
  async function seeded() {
    const { repos } = createTestRepositories();
    await repos.wines.createWithRating(
      { name: 'Zinfandel', type: 'red' },
      { stars: 3, tastedOn: '2025-05-01' },
    );
    await repos.wines.createWithRating(
      { name: 'Albariño', type: 'white' },
      { stars: 5, tastedOn: '2025-02-01' },
    );
    await repos.wines.createWithRating(
      { name: 'Chablis', type: 'white' },
      { stars: 4, tastedOn: '2025-06-01' },
    );
    return repos;
  }
  const names = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

  it('sorts by recent, rating and name', async () => {
    renderApp('/', await seeded());
    await screen.findByRole('heading', { level: 1, name: 'My cellar' });
    expect(names()).toEqual(['Chablis', 'Zinfandel', 'Albariño']);
    await userEvent.selectOptions(screen.getByLabelText('Sort by'), 'Highest rated');
    expect(names()).toEqual(['Albariño', 'Chablis', 'Zinfandel']);
    await userEvent.selectOptions(screen.getByLabelText('Sort by'), 'Name (A to Z)');
    expect(names()).toEqual(['Albariño', 'Chablis', 'Zinfandel']);
    await userEvent.selectOptions(screen.getByLabelText('Sort by'), 'Most recent');
    expect(names()).toEqual(['Chablis', 'Zinfandel', 'Albariño']);
  });

  it('filters by wine type and clears the filter', async () => {
    renderApp('/', await seeded());
    await userEvent.click(await screen.findByRole('button', { name: 'White' }));
    expect(names()).toEqual(['Chablis', 'Albariño']);
    expect(screen.getByRole('status')).toHaveTextContent('2 of 3 wines');
    await userEvent.click(screen.getByRole('button', { name: 'White' }));
    expect(names()).toHaveLength(3);
  });

  it('shows a message when no wine matches the filter', async () => {
    renderApp('/', await seeded());
    await userEvent.click(await screen.findByRole('button', { name: 'Dessert' }));
    expect(
      screen.getByRole('heading', { level: 2, name: 'No dessert wines yet' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show all wines' }));
    expect(names()).toHaveLength(3);
  });

  it('reads sort and filter from the address and ignores nonsense', async () => {
    const repos = await seeded();
    renderApp('/?type=white&sort=name', repos);
    await screen.findByRole('heading', { level: 1, name: 'My cellar' });
    expect(names()).toEqual(['Albariño', 'Chablis']);
  });

  it('falls back to defaults for unknown values in the address', async () => {
    renderApp('/?type=blue&sort=price', await seeded());
    await screen.findByRole('heading', { level: 1, name: 'My cellar' });
    expect(names()).toEqual(['Chablis', 'Zinfandel', 'Albariño']);
  });
});
