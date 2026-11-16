import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Repositories } from '../data/repositories';
import { createTestRepositories } from '../data/testing';
import type { Wine } from '../domain/types';
import { renderApp } from '../test/render';

let repos: Repositories;
let existing: Wine;

beforeEach(async () => {
  repos = createTestRepositories().repos;
  ({ wine: existing } = await repos.wines.createWithRating(
    { name: 'Barolo', producer: 'Conterno', vintage: 2015 },
    { stars: 5, tastedOn: '2025-03-01' },
  ));
});

async function fillDuplicate() {
  await userEvent.type(screen.getByLabelText('Wine name'), '  barolo ');
  await userEvent.type(screen.getByLabelText(/Producer/), 'CONTERNO');
  await userEvent.type(screen.getByLabelText(/Vintage/), '2015');
  await userEvent.click(screen.getByRole('radio', { name: '3 stars' }));
  await userEvent.click(screen.getByRole('button', { name: 'Save to my cellar' }));
}

describe('duplicate suggestion', () => {
  it('suggests the existing wine and saves nothing by itself', async () => {
    renderApp('/wines/new', repos);
    await fillDuplicate();
    const notice = await screen.findByRole('group', { name: 'You already have this wine' });
    expect(notice).toHaveTextContent('Barolo by Conterno (2015)');
    expect(notice).toHaveFocus();
    expect(await repos.wines.list()).toHaveLength(1);
    expect(await repos.ratings.list()).toHaveLength(1);
  });

  it('adds the tasting to the existing wine when I choose that', async () => {
    renderApp('/wines/new', repos);
    await fillDuplicate();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Add tasting to existing wine' }),
    );
    expect(await screen.findByText('Average of 2 tastings')).toBeInTheDocument();
    expect(await repos.wines.list()).toHaveLength(1);
    expect(await repos.ratings.listForWine(existing.id)).toHaveLength(2);
  });

  it('saves a separate wine when I choose that', async () => {
    renderApp('/wines/new', repos);
    await fillDuplicate();
    await userEvent.click(await screen.findByRole('button', { name: 'Save as a new wine' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'My cellar' })).toBeInTheDocument();
    expect(await repos.wines.list()).toHaveLength(2);
    expect(await repos.ratings.listForWine(existing.id)).toHaveLength(1);
  });

  it('withdraws the suggestion when the wine is changed so it no longer matches', async () => {
    renderApp('/wines/new', repos);
    await fillDuplicate();
    await screen.findByRole('group', { name: 'You already have this wine' });
    await userEvent.clear(screen.getByLabelText(/Vintage/));
    await userEvent.type(screen.getByLabelText(/Vintage/), '2016');
    expect(
      screen.queryByRole('group', { name: 'You already have this wine' }),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save to my cellar' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'My cellar' })).toBeInTheDocument();
    expect(await repos.wines.list()).toHaveLength(2);
  });

  it('does not suggest anything for a different vintage', async () => {
    renderApp('/wines/new', repos);
    await userEvent.type(screen.getByLabelText('Wine name'), 'Barolo');
    await userEvent.type(screen.getByLabelText(/Producer/), 'Conterno');
    await userEvent.type(screen.getByLabelText(/Vintage/), '2016');
    await userEvent.click(screen.getByRole('radio', { name: '3 stars' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save to my cellar' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'My cellar' })).toBeInTheDocument();
  });
});
