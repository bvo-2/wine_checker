import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryStrip } from './CategoryStrip';

const CATEGORIES = [
  { id: 'red', label: 'Red', dot: 'red' },
  { id: 'white', label: 'White', dot: 'white' },
] as const;

describe('CategoryStrip', () => {
  it('renders a labelled group of chips, none pressed by default', () => {
    render(
      <CategoryStrip label="Filter by wine type" categories={CATEGORIES} onChange={() => {}} />,
    );
    expect(screen.getByRole('group', { name: 'Filter by wine type' })).toBeInTheDocument();
    for (const chip of screen.getAllByRole('button')) {
      expect(chip).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('marks the active chip as pressed', () => {
    render(
      <CategoryStrip label="Type" categories={CATEGORIES} active="white" onChange={() => {}} />,
    );
    expect(screen.getByRole('button', { name: 'White' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Red' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the chosen category', async () => {
    const onChange = vi.fn();
    render(<CategoryStrip label="Type" categories={CATEGORIES} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Red' }));
    expect(onChange).toHaveBeenCalledWith('red');
  });

  it('clears the filter when the active chip is pressed again', async () => {
    const onChange = vi.fn();
    render(<CategoryStrip label="Type" categories={CATEGORIES} active="red" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Red' }));
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('works with the keyboard', async () => {
    const onChange = vi.fn();
    render(<CategoryStrip label="Type" categories={CATEGORIES} onChange={onChange} />);
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('white');
  });

  it('renders nothing odd with no categories', () => {
    render(<CategoryStrip label="Type" categories={[]} onChange={() => {}} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
