import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { WINE_TYPES } from '../../domain/types';
import { WineCard, type WineCardProps } from './WineCard';

function renderCard(props: Partial<WineCardProps> = {}) {
  return render(
    <MemoryRouter>
      <WineCard to="/wines/w1" title="Barolo" {...props} />
    </MemoryRouter>,
  );
}

describe('WineCard', () => {
  it('shows the meta in order: title and score, producer · region, vintage · type, price', () => {
    renderCard({
      producer: 'Brezza',
      region: 'Piedmont',
      vintage: 2018,
      wine: 'red',
      rating: 4.6,
      ratingCount: 812,
      price: '€48',
      priceUnit: 'bottle',
    });
    expect(screen.getByRole('link')).toHaveAttribute('href', '/wines/w1');
    expect(screen.getByRole('heading', { level: 3, name: 'Barolo' })).toBeInTheDocument();
    expect(screen.getByText('4.6', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('(812)')).toBeInTheDocument();
    expect(screen.getByText('Brezza · Piedmont')).toBeInTheDocument();
    expect(screen.getByText('2018 · Red')).toBeInTheDocument();
    expect(screen.getByText('€48').closest('p')).toHaveTextContent('€48 bottle');
  });

  it('shows scores with one decimal', () => {
    renderCard({ rating: 4 });
    expect(screen.getByRole('link')).toHaveTextContent('4.0');
  });

  it('shows NV and no score, price or heart for a bare wine', () => {
    renderCard();
    expect(screen.getByText('NV')).toBeInTheDocument();
    expect(screen.queryByText(/\d\.\d/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it.each(WINE_TYPES)('with no image, shows a %s bottle silhouette in the type colour', (wine) => {
    const { container } = renderCard({ wine });
    const bottle = container.querySelector('svg[data-wine-type]');
    expect(bottle).toHaveAttribute('data-wine-type', wine);
    expect(bottle?.querySelector('path')).toHaveAttribute('fill', `var(--wine-${wine})`);
    expect(container.querySelector('img')).toBeNull();
  });

  it('uses a neutral silhouette when the type is unknown', () => {
    const { container } = renderCard();
    expect(container.querySelector('svg[data-wine-type] path')).toHaveAttribute(
      'fill',
      'var(--muted-soft)',
    );
  });

  it('shows the image instead of the silhouette, with alt text', () => {
    const { container } = renderCard({ image: 'bottle.jpg', wine: 'red' });
    expect(screen.getByRole('img', { name: 'Bottle of Barolo' })).toHaveAttribute(
      'src',
      'bottle.jpg',
    );
    expect(container.querySelector('svg[data-wine-type]')).toBeNull();
    renderCard({ image: 'b.jpg', imageAlt: 'Front label' });
    expect(screen.getByRole('img', { name: 'Front label' })).toBeInTheDocument();
  });

  it('shows a floating badge', () => {
    renderCard({ badge: '3 tastings', badgeTone: 'primary' });
    expect(screen.getByText('3 tastings')).toHaveClass('floating', 'primary');
  });

  it('shows a save heart that toggles when onSave is given', async () => {
    const onSave = vi.fn();
    renderCard({ onSave, saved: false });
    const heart = screen.getByRole('button', { name: 'Save Barolo to cellar' });
    expect(heart).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(heart);
    expect(onSave).toHaveBeenCalledWith(true);
  });

  it('shows the saved heart as pressed', async () => {
    const onSave = vi.fn();
    renderCard({ onSave, saved: true });
    const heart = screen.getByRole('button', { name: 'Remove Barolo from cellar' });
    expect(heart).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(heart);
    expect(onSave).toHaveBeenCalledWith(false);
  });

  it('names the rating for screen readers', () => {
    renderCard({ rating: 5, ratingLabel: 'Latest rating' });
    expect(screen.getByText('Latest rating:')).toHaveClass('sr-only');
  });

  it('renders without a link when no address is given', () => {
    render(<WineCard title="Barolo" />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Barolo' })).toBeInTheDocument();
  });
});
