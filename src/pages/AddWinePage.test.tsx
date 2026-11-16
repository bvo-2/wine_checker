import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../test/render';
import { todayIso } from '../domain/dates';

describe('Add a wine', () => {
  it('saves with only a name and stars, then shows the wine in the cellar', async () => {
    const { repos } = renderApp('/wines/new');
    await userEvent.type(screen.getByLabelText('Wine name'), 'Barolo');
    await userEvent.click(screen.getByRole('button', { name: '4 stars' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save to my cellar' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'My cellar' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Barolo' })).toBeInTheDocument();
    const [wine] = await repos.wines.list();
    const [rating] = await repos.ratings.list();
    expect(wine).toMatchObject({ name: 'Barolo' });
    expect(rating).toMatchObject({ wineId: wine?.id, stars: 4, tastedOn: todayIso() });
  });

  it('saves every field', async () => {
    const { repos } = renderApp('/wines/new');
    await userEvent.type(screen.getByLabelText('Wine name'), 'Monfortino');
    await userEvent.type(screen.getByLabelText(/Producer/), 'Giacomo Conterno');
    await userEvent.type(screen.getByLabelText(/Vintage/), '2015');
    await userEvent.selectOptions(screen.getByLabelText(/Type/), 'Red');
    await userEvent.selectOptions(screen.getByLabelText(/Country/), 'Italy');
    await userEvent.type(screen.getByLabelText(/Region/), 'Piedmont');
    await userEvent.type(screen.getByLabelText(/Alcohol/), '14.5');
    await userEvent.type(screen.getByLabelText(/Grapes/), 'Nebbiolo');
    await userEvent.click(screen.getByRole('button', { name: '5 stars' }));
    await userEvent.type(screen.getByLabelText(/Tasting note/), 'Roses and tar.');
    await userEvent.type(screen.getByLabelText(/Place/), 'At home');
    await userEvent.type(screen.getByLabelText(/Price paid/), '120');
    await userEvent.selectOptions(screen.getByLabelText('Currency'), 'USD');
    await userEvent.click(screen.getByRole('button', { name: 'Save to my cellar' }));

    await screen.findByRole('heading', { level: 1, name: 'My cellar' });
    expect((await repos.wines.list())[0]).toMatchObject({
      name: 'Monfortino',
      producer: 'Giacomo Conterno',
      vintage: 2015,
      type: 'red',
      country: 'IT',
      region: 'Piedmont',
      abv: 14.5,
      grapes: ['Nebbiolo'],
    });
    expect((await repos.ratings.list())[0]).toMatchObject({
      stars: 5,
      note: 'Roses and tar.',
      place: 'At home',
      pricePaid: 120,
      currency: 'USD',
    });
  });

  it('shows messages for missing name and stars, focuses the first, and saves nothing', async () => {
    const { repos } = renderApp('/wines/new');
    await userEvent.click(screen.getByRole('button', { name: 'Save to my cellar' }));

    const name = screen.getByLabelText('Wine name');
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription('Enter the name of the wine');
    expect(
      screen.getByRole('group', { name: 'Your rating, required' }),
    ).toHaveAccessibleDescription('Choose a rating from 1 to 5 stars');
    await waitFor(() => expect(name).toHaveFocus());
    expect(await repos.wines.list()).toEqual([]);
  });

  it('shows messages for bad values and keeps what was typed', async () => {
    const { repos } = renderApp('/wines/new');
    await userEvent.type(screen.getByLabelText('Wine name'), 'Barolo');
    await userEvent.type(screen.getByLabelText(/Vintage/), '1492');
    await userEvent.type(screen.getByLabelText(/Alcohol/), '80');
    await userEvent.type(screen.getByLabelText(/Price paid/), 'cheap');
    await userEvent.click(screen.getByRole('button', { name: '3 stars' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save to my cellar' }));

    expect(screen.getByLabelText(/Vintage/)).toHaveAccessibleDescription(/Enter a year from 1800/);
    expect(screen.getByLabelText(/Alcohol/)).toHaveAccessibleDescription(/from 0 to 25/);
    expect(screen.getByLabelText(/Price paid/)).toHaveAccessibleDescription(/Enter a price/);
    expect(screen.getByLabelText('Wine name')).toHaveValue('Barolo');
    await waitFor(() => expect(screen.getByLabelText(/Vintage/)).toHaveFocus());
    expect(await repos.wines.list()).toEqual([]);
  });

  it('clears the messages once the input is fixed and saved', async () => {
    renderApp('/wines/new');
    await userEvent.click(screen.getByRole('button', { name: 'Save to my cellar' }));
    await userEvent.type(screen.getByLabelText('Wine name'), 'Barolo');
    await userEvent.click(screen.getByRole('button', { name: '2 stars' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save to my cellar' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'My cellar' })).toBeInTheDocument();
  });

  it('tells me when the browser cannot save, and keeps the form', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { repos } = renderApp('/wines/new');
    vi.spyOn(repos.wines, 'createWithRating').mockRejectedValue(new Error('QuotaExceededError'));
    await userEvent.type(screen.getByLabelText('Wine name'), 'Barolo');
    await userEvent.click(screen.getByRole('button', { name: '4 stars' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save to my cellar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save');
    expect(screen.getByLabelText('Wine name')).toHaveValue('Barolo');
    expect(screen.getByRole('button', { name: 'Save to my cellar' })).toBeEnabled();
  });
});
