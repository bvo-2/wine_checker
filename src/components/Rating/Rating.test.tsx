import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Rating, RatingStars } from './Rating';

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

describe('Rating', () => {
  it('is a labelled radio group of five stars with nothing chosen', () => {
    render(<Controlled />);
    expect(screen.getByRole('radiogroup', { name: 'Your rating' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio').map((r) => r.getAttribute('aria-label'))).toEqual([
      '1 star',
      '2 stars',
      '3 stars',
      '4 stars',
      '5 stars',
    ]);
    expect(screen.queryByRole('radio', { checked: true })).not.toBeInTheDocument();
    expect(filled()).toBe(0);
  });

  it('chooses a rating on click and fills the stars up to it', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: '4 stars' }));
    expect(onChange).toHaveBeenCalledWith(4);
    expect(screen.getByRole('radio', { name: '4 stars' })).toBeChecked();
    expect(screen.getByText('4 of 5')).toBeInTheDocument();
    await userEvent.unhover(screen.getByRole('radiogroup'));
    expect(filled()).toBe(4);
  });

  it('previews on hover without changing the value', async () => {
    render(<Controlled initial={2} />);
    const fifth = screen.getByRole('radio', { name: '5 stars' }).closest('label');
    await userEvent.hover(fifth as HTMLElement);
    expect(filled()).toBe(5);
    await userEvent.unhover(screen.getByRole('radiogroup'));
    expect(filled()).toBe(2);
    expect(screen.getByRole('radio', { name: '2 stars' })).toBeChecked();
  });

  it('can be changed with the arrow keys', async () => {
    const onChange = vi.fn();
    render(<Controlled initial={3} onChange={onChange} />);
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: '3 stars' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith(4);
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith(2);
  });

  it('shows the error state with a message', () => {
    render(<Rating label="Your rating" onChange={() => {}} error="Choose a rating" required />);
    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAttribute('aria-required', 'true');
    expect(group).toHaveAccessibleDescription('Choose a rating');
  });

  it('cannot be changed when disabled', async () => {
    const onChange = vi.fn();
    render(<Rating label="Your rating" value={2} onChange={onChange} disabled />);
    await userEvent.click(screen.getByRole('radio', { name: '5 stars' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('RatingStars', () => {
  it('describes the value for screen readers and fills whole stars', () => {
    render(<RatingStars value={3.6} />);
    expect(screen.getByRole('img', { name: '3.6 out of 5 stars' })).toBeInTheDocument();
    expect(filled()).toBe(4);
  });

  it('can print the number with one decimal', () => {
    render(<RatingStars value={4} showValue />);
    expect(screen.getByText('4.0')).toBeInTheDocument();
  });
});
