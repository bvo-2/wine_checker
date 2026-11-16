import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ProductTabs } from './ProductTabs';

const TABS = [
  { label: 'Wines', to: '/', end: true },
  { label: 'Wineries', to: '/wineries' },
  { label: 'Regions', to: '/regions' },
];

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ProductTabs tabs={TABS} />
    </MemoryRouter>,
  );
}

describe('ProductTabs', () => {
  it('renders every tab as a link inside a labelled navigation', () => {
    renderAt('/');
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeInTheDocument();
    expect(screen.getAllByRole('link').map((a) => a.textContent)).toEqual([
      'Wines',
      'Wineries',
      'Regions',
    ]);
  });

  it('marks only the current tab', () => {
    renderAt('/wineries');
    expect(screen.getByRole('link', { name: 'Wineries' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Wines' })).not.toHaveAttribute('aria-current');
  });

  it('moves the current marker when another tab is chosen', async () => {
    renderAt('/');
    await userEvent.click(screen.getByRole('link', { name: 'Regions' }));
    expect(screen.getByRole('link', { name: 'Regions' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Wines' })).not.toHaveAttribute('aria-current');
  });

  it('is reachable with the keyboard', async () => {
    renderAt('/');
    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'Wines' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'Wineries' })).toHaveFocus();
  });
});
