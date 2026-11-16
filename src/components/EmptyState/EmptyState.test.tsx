import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('shows a title, text and an action link', () => {
    render(
      <MemoryRouter>
        <EmptyState
          title="Your cellar is empty"
          text="Add your first wine."
          action={{ label: 'Add a wine', to: '/wines/new' }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Your cellar is empty' })).toBeVisible();
    expect(screen.getByText('Add your first wine.')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Add a wine' })).toHaveAttribute('href', '/wines/new');
  });

  it('uses a level-1 heading when it is the whole page', () => {
    render(
      <MemoryRouter>
        <EmptyState level={1} title="Page not found" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
