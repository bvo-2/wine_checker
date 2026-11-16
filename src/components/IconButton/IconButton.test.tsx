import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { IconButton, IconButtonLink } from './IconButton';

describe('IconButton', () => {
  it('exposes its label as the accessible name and hides the icon', () => {
    render(<IconButton icon="menu" label="Open menu" />);
    const button = screen.getByRole('button', { name: 'Open menu' });
    expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(button).toHaveAttribute('type', 'button');
  });

  it.each(['circle', 'outline', 'ghost'] as const)('applies the %s variant', (variant) => {
    render(<IconButton icon="close" label="Close" variant={variant} />);
    expect(screen.getByRole('button')).toHaveClass(variant);
  });

  it('handles clicks and keyboard activation', async () => {
    const onClick = vi.fn();
    render(<IconButton icon="close" label="Close" onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    await userEvent.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('is a circle by default and supports the pressed state for toggles', () => {
    render(<IconButton icon="heart-filled" label="Saved" aria-pressed="true" />);
    const button = screen.getByRole('button', { name: 'Saved' });
    expect(button).toHaveClass('circle');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('does nothing when disabled', async () => {
    const onClick = vi.fn();
    render(<IconButton icon="trash" label="Delete" disabled onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('can render as a link', () => {
    render(
      <MemoryRouter>
        <IconButtonLink icon="plus" label="Add a wine" to="/wines/new" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Add a wine' })).toHaveAttribute('href', '/wines/new');
  });
});
