import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RatingDisplay } from './RatingDisplay';

describe('RatingDisplay', () => {
  it('shows the score with one decimal, stars and a label', () => {
    render(<RatingDisplay value={4.3333} label="Average of 3 tastings" />);
    expect(screen.getByText('4.3')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '4.3 out of 5 stars' })).toBeInTheDocument();
    expect(screen.getByText('Average of 3 tastings')).toBeInTheDocument();
  });

  it('shows whole scores as 5.0, not 5', () => {
    render(<RatingDisplay value={5} />);
    expect(screen.getByText('5.0')).toBeInTheDocument();
  });

  it('shows an empty state instead of 0.0 when there is no score', () => {
    render(<RatingDisplay label="No tastings yet" />);
    expect(screen.getByLabelText('Not rated yet')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText('0.0')).not.toBeInTheDocument();
  });

  it('shows at most three stats as term and value pairs', () => {
    render(
      <RatingDisplay
        value={4}
        stats={[
          { label: 'Tastings', value: '3' },
          { label: 'Best', value: '5' },
          { label: 'Last tasted', value: '1 May 2025' },
          { label: 'Extra', value: 'hidden' },
        ]}
      />,
    );
    expect(screen.getAllByRole('term').map((t) => t.textContent)).toEqual([
      'Tastings',
      'Best',
      'Last tasted',
    ]);
    expect(screen.getByText('1 May 2025')).toBeInTheDocument();
    expect(screen.queryByText('hidden')).not.toBeInTheDocument();
  });

  it('shows a description', () => {
    render(<RatingDisplay value={3} description="Based on my own notes" />);
    expect(screen.getByText('Based on my own notes')).toBeInTheDocument();
  });
});
