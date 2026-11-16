import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Repositories } from '../data/repositories';
import { createTestRepositories } from '../data/testing';
import { renderApp } from '../test/render';

let repos: Repositories;

beforeEach(async () => {
  repos = createTestRepositories().repos;
  const a = await repos.wines.createWithRating(
    { name: 'Barolo', producer: 'Conterno', region: 'Piedmont', country: 'IT', vintage: 2015 },
    { stars: 5, tastedOn: '2025-03-01', note: 'Superb' },
  );
  await repos.ratings.create(a.wine.id, { stars: 4, tastedOn: '2025-03-20' });
  await repos.wines.createWithRating(
    { name: 'Barbera', producer: 'conterno', region: 'Piedmont', country: 'IT' },
    { stars: 3, tastedOn: '2025-02-10' },
  );
  await repos.wines.createWithRating(
    { name: 'Chablis', producer: 'Raveneau', region: 'Burgundy', country: 'FR' },
    { stars: 5, tastedOn: '2024-12-31' },
  );
  await repos.wines.createWithRating({ name: 'House red' }, { stars: 2, tastedOn: '2025-03-05' });
});

const rows = () =>
  within(screen.getByRole('main'))
    .getAllByRole('listitem')
    .map((li) => li.textContent);

describe.each([
  [
    '/wineries',
    'Wineries',
    [
      'Conterno2 wines · 3 tastingsAverage rating: 4.0',
      'Raveneau1 wine · 1 tastingAverage rating: 5.0',
      'Unknown1 wine · 1 tastingAverage rating: 2.0',
    ],
  ],
  [
    '/regions',
    'Regions',
    [
      'Burgundy1 wine · 1 tastingAverage rating: 5.0',
      'Piedmont2 wines · 3 tastingsAverage rating: 4.0',
      'Unknown1 wine · 1 tastingAverage rating: 2.0',
    ],
  ],
  [
    '/countries',
    'Countries',
    [
      'France1 wine · 1 tastingAverage rating: 5.0',
      'Italy2 wines · 3 tastingsAverage rating: 4.0',
      'Unknown1 wine · 1 tastingAverage rating: 2.0',
    ],
  ],
])('%s', (path, title, expected) => {
  it('lists groups with wine counts and average rating, Unknown last', async () => {
    renderApp(path, repos);
    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(rows()).toEqual(expected);
  });

  it('shows an empty state with no wines', async () => {
    renderApp(path);
    expect(
      await screen.findByRole('heading', { level: 1, name: `No ${title.toLowerCase()} yet` }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: 'Add a wine' }),
    ).toHaveAttribute('href', '/wines/new');
  });
});

describe('browsing', () => {
  it('sorts groups by rating', async () => {
    renderApp('/wineries', repos);
    await userEvent.selectOptions(await screen.findByLabelText('Sort by'), 'Highest rated');
    expect(rows().map((r) => r?.replace(/\d.*/, ''))).toEqual(['Raveneau', 'Conterno', 'Unknown']);
  });

  it('opens a filtered cellar view from a group, and goes back', async () => {
    renderApp('/wineries', repos);
    await userEvent.click(await screen.findByRole('link', { name: /Conterno/ }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Conterno' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Barolo',
      'Barbera',
    ]);
    await userEvent.click(within(screen.getByRole('main')).getByRole('link', { name: 'Wineries' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Wineries' })).toBeInTheDocument();
  });

  it('opens the Unknown group', async () => {
    renderApp('/countries', repos);
    await userEvent.click(await screen.findByRole('link', { name: /Unknown/ }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Unknown country' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'House red',
    ]);
  });

  it('explains when a group in the address has no wines', async () => {
    renderApp('/?region=atlantis', repos);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'No wines for this region' }),
    ).toBeInTheDocument();
  });
});

describe('Tastings', () => {
  it('lists every tasting newest first under month headings, linked to its wine', async () => {
    renderApp('/tastings', repos);
    expect(await screen.findByRole('heading', { level: 1, name: 'Tastings' })).toBeInTheDocument();
    expect(screen.getByText('5 tastings')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'March 2025',
      'February 2025',
      'December 2024',
    ]);
    const march = screen.getByRole('region', { name: 'March 2025' });
    expect(
      within(march)
        .getAllByRole('heading', { level: 3 })
        .map((h) => h.textContent),
    ).toEqual(['20 March 2025', '5 March 2025', '1 March 2025']);
    expect(
      within(march)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual(['Barolo 2015', 'House red', 'Barolo 2015']);
    expect(within(march).getByText('Superb')).toBeInTheDocument();
  });

  it('shows an empty state with no tastings', async () => {
    renderApp('/tastings');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'No tastings yet' }),
    ).toBeInTheDocument();
  });
});
