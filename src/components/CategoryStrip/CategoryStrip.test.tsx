import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryStrip } from './CategoryStrip';

const ITEMS = [
  { id: 'red', label: 'Red', wine: 'red' },
  { id: 'white', label: 'White', wine: 'white' },
  { id: 'natural', label: 'Natural' },
] as const;

describe('CategoryStrip', () => {
  it('defaults to the six wine types, each with its colour dot and a text label', () => {
    const { container } = render(<CategoryStrip />);
    expect(screen.getByRole('group', { name: 'Filter by wine type' })).toBeInTheDocument();
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Red',
      'White',
      'Rosé',
      'Orange',
      'Sparkling',
      'Dessert',
    ]);
    expect(
      [...container.querySelectorAll('[data-type]')].map((d) => d.getAttribute('data-type')),
    ).toEqual(['red', 'white', 'rose', 'orange', 'sparkling', 'dessert']);
    for (const chip of screen.getAllByRole('button')) {
      expect(chip).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('takes other items, with or without a dot', () => {
    const { container } = render(<CategoryStrip items={ITEMS} label="Style" />);
    expect(screen.getByRole('group', { name: 'Style' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(container.querySelectorAll('[data-type]')).toHaveLength(2);
  });

  it('marks the active chip as pressed', () => {
    render(<CategoryStrip items={ITEMS} active="white" />);
    expect(screen.getByRole('button', { name: 'White' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Red' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the chosen item', async () => {
    const onChange = vi.fn();
    render(<CategoryStrip items={ITEMS} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Red' }));
    expect(onChange).toHaveBeenCalledWith('red');
  });

  it('clears the filter when the pressed chip is pressed again', async () => {
    const onChange = vi.fn();
    render(<CategoryStrip items={ITEMS} active="red" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Red' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('works with the keyboard', async () => {
    const onChange = vi.fn();
    render(<CategoryStrip items={ITEMS} onChange={onChange} />);
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('white');
  });

  it('renders an empty group with no items', () => {
    render(<CategoryStrip items={[]} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
