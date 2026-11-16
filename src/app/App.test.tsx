import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../test/render';
import { ErrorBoundary } from './ErrorBoundary';

describe('App shell', () => {
  it('shows the brand, the five product tabs and the main landmark', async () => {
    renderApp();
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByRole('link', { name: 'Decant, home' })).toBeInTheDocument();
    const tabs = screen.getAllByRole('navigation', { name: 'Sections' })[0];
    expect(tabs).toBeDefined();
    expect(
      within(tabs as HTMLElement)
        .getAllByRole('link')
        .map((a) => a.textContent),
    ).toEqual(['Wines', 'Wineries', 'Regions', 'Countries', 'Tastings']);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('shows a 404 page for unknown routes', () => {
    renderApp('/no/such/page');
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
  });

  it('opens the menu sheet and navigates from it', async () => {
    renderApp();
    await userEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    const dialog = screen.getByRole('dialog', { name: 'Menu' });
    await userEvent.click(within(dialog).getByRole('link', { name: 'Backup and restore' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Backup and restore');
  });
});

describe('ErrorBoundary', () => {
  it('shows a recovery screen when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Stop jsdom from also printing the expected error.
    const swallow = (event: ErrorEvent) => event.preventDefault();
    window.addEventListener('error', swallow);
    onTestFinished(() => window.removeEventListener('error', swallow));
    function Boom(): never {
      throw new Error('boom');
    }
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByRole('button', { name: 'Reload Decant' })).toBeInTheDocument();
  });
});
