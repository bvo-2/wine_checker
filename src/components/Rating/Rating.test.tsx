import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Rating } from './Rating';

function Controlled({
  initial = 0,
  onChange = () => {},
}: {
  initial?: number;
  onChange?: (n: number) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <Rating
      label="Your rating"
      value={value}
      onChange={(stars) => {
        setValue(stars);
        onChange(stars);
      }}
    />
  );
}

const filled = () => document.querySelectorAll('[data-icon="star-filled"]').length;

describe('Rating (input)', () => {
  it('is a labelled group of five star buttons, each with a spoken label, none chosen', () => {
    render(<Controlled />);
    expect(screen.getByRole('group', { name: 'Your rating' })).toBeInTheDocument();
    expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
      '1 star',
      '2 stars',
      '3 stars',
      '4 stars',
      '5 stars',
    ]);
    expect(screen.queryByRole('button', { pressed: true })).not.toBeInTheDocument();
    expect(filled()).toBe(0);
  });

  it('sets the rating on click and fills the stars up to it', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: '4 stars' }));
    expect(onChange).toHaveBeenCalledWith(4);
    expect(screen.getByRole('button', { name: '4 stars' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.unhover(screen.getByRole('group'));
    expect(filled()).toBe(4);
  });

  it('previews on hover without changing the value', async () => {
    render(<Controlled initial={2} />);
    await userEvent.hover(screen.getByRole('button', { name: '5 stars' }));
    expect(filled()).toBe(5);
    await userEvent.unhover(screen.getByRole('group'));
    expect(filled()).toBe(2);
    expect(screen.getByRole('button', { name: '2 stars' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('works with the keyboard', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: '3 stars' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(3);
    await userEvent.tab();
    await userEvent.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith(4);
  });

  it('supports a different maximum', () => {
    render(<Rating label="Score" max={3} />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('shows the error state with a message and says when it is required', () => {
    render(<Rating label="Your rating" error="Choose a rating" required />);
    const group = screen.getByRole('group', { name: 'Your rating, required' });
    expect(group).toHaveAttribute('data-invalid', 'true');
    expect(group).toHaveAccessibleDescription('Choose a rating');
  });

  it('cannot be changed when disabled', async () => {
    const onChange = vi.fn();
    render(<Rating label="Your rating" value={2} onChange={onChange} disabled />);
    await userEvent.click(screen.getByRole('button', { name: '5 stars' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Rating (read-only)', () => {
  it('size="sm" renders 12px display stars rounded to the nearest whole star', () => {
    const { container } = render(<Rating size="sm" value={3.6} />);
    expect(screen.getByRole('img', { name: '3.6 out of 5 stars' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(filled()).toBe(4);
    expect(container.querySelector('svg')).toHaveAttribute('width', '12');
  });

  it('readOnly renders display stars at the default size', () => {
    const { container } = render(<Rating readOnly value={2.4} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(filled()).toBe(2);
    expect(container.querySelector('svg')).toHaveAttribute('width', '24');
  });

  it('showValue prints the number with one decimal', () => {
    render(<Rating size="sm" value={4} showValue />);
    expect(screen.getByText('4.0')).toBeInTheDocument();
  });

  it('includes the label in the spoken text', () => {
    render(<Rating size="sm" value={5} label="Latest rating" />);
    expect(
      screen.getByRole('img', { name: 'Latest rating: 5.0 out of 5 stars' }),
    ).toBeInTheDocument();
  });
});
