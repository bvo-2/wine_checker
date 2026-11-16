import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReviewCard } from './ReviewCard';

describe('ReviewCard', () => {
  it('shows the date, stars, note and facts', () => {
    render(
      <ReviewCard
        title="14 March 2025"
        stars={4}
        note={'Cherries.\nLong finish.'}
        meta={['At home', '€18.50']}
      />,
    );
    expect(screen.getByRole('heading', { level: 3, name: '14 March 2025' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '4.0 out of 5 stars' })).toBeInTheDocument();
    expect(screen.getByText(/Cherries\.\s+Long finish\./)).toBeInTheDocument();
    expect(screen.getByText('At home · €18.50')).toBeInTheDocument();
  });

  it('says so when there is no note', () => {
    render(<ReviewCard title="1 May 2025" stars={2} />);
    expect(screen.getByText('No note for this tasting.')).toBeInTheDocument();
  });

  it('renders an eyebrow, actions and a custom heading level', () => {
    render(
      <ReviewCard
        title="1 May 2025"
        eyebrow="Barolo"
        stars={5}
        level={2}
        actions={<button>Edit</button>}
      />,
    );
    expect(screen.getByText('Barolo')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('does not render HTML in a note', () => {
    const { container } = render(<ReviewCard title="x" stars={1} note={'<img src=x onerror=1>'} />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('<img src=x onerror=1>')).toBeInTheDocument();
  });
});
