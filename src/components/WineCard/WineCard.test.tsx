import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WINE_TYPES } from '../../domain/types';
import { WineCard, type WineCardProps } from './WineCard';

function renderCard(props: Partial<WineCardProps> = {}) {
  return render(
    <MemoryRouter>
      <WineCard to="/wines/w1" name="Barolo" {...props} />
    </MemoryRouter>,
  );
}

describe('WineCard', () => {
  it('links to the wine and shows its details', () => {
    renderCard({ producer: 'Conterno', region: 'Piedmont', vintage: 2015, type: 'red', rating: 4 });
    expect(screen.getByRole('link')).toHaveAttribute('href', '/wines/w1');
    expect(screen.getByRole('heading', { level: 3, name: 'Barolo' })).toBeInTheDocument();
    expect(screen.getByText('Conterno · Piedmont')).toBeInTheDocument();
    expect(screen.getByText('2015 · Red')).toBeInTheDocument();
    expect(screen.getByText('4.0')).toBeInTheDocument();
  });

  it('shows NV and no score for a bare wine', () => {
    renderCard();
    expect(screen.getByText('NV')).toBeInTheDocument();
    expect(screen.queryByText(/\d\.\d/)).not.toBeInTheDocument();
  });

  it.each(WINE_TYPES)(
    'shows a %s bottle silhouette in the type colour when there is no photo',
    (type) => {
      const { container } = renderCard({ type });
      const bottle = container.querySelector('svg[data-wine-type]');
      expect(bottle).toHaveAttribute('data-wine-type', type);
      expect(bottle?.querySelector('path')).toHaveAttribute('fill', `var(--wine-${type})`);
      expect(container.querySelector('img')).toBeNull();
    },
  );

  it('uses a neutral silhouette when the type is unknown', () => {
    const { container } = renderCard();
    expect(container.querySelector('svg[data-wine-type] path')).toHaveAttribute(
      'fill',
      'var(--muted-soft)',
    );
  });

  it('shows the photo instead of the silhouette when there is one', () => {
    const { container } = renderCard({ imageUrl: 'bottle.jpg', type: 'red' });
    expect(container.querySelector('img')).toHaveAttribute('src', 'bottle.jpg');
    expect(container.querySelector('svg[data-wine-type]')).toBeNull();
  });

  it('shows a badge', () => {
    renderCard({ badge: '3 tastings' });
    expect(screen.getByText('3 tastings')).toBeInTheDocument();
  });

  it('names the rating for screen readers', () => {
    renderCard({ rating: 5, ratingLabel: 'Latest rating' });
    expect(screen.getByText('Latest rating:')).toHaveClass('sr-only');
  });
});
