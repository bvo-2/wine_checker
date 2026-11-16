import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewCard } from './ReviewCard';

describe('ReviewCard', () => {
  it('shows the author, date, stars and note', () => {
    render(
      <ReviewCard author="Barolo Cannubi" date="14 March 2025 · At home" rating={4}>
        {'Cherries.\nLong finish.'}
      </ReviewCard>,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Barolo Cannubi' })).toBeInTheDocument();
    expect(screen.getByText('14 March 2025 · At home')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '4.0 out of 5 stars' })).toBeInTheDocument();
    expect(screen.getByText(/Cherries\.\s+Long finish\./)).toHaveClass('clamped');
  });

  it('shows initials when there is no avatar image', () => {
    render(<ReviewCard author="marie de la tour" />);
    expect(screen.getByText('MT')).toHaveAttribute('aria-hidden', 'true');
  });

  it('shows the avatar image when given, or no avatar when hidden', () => {
    const { container, rerender } = render(<ReviewCard author="Marie" avatar="marie.jpg" />);
    expect(container.querySelector('img')).toHaveAttribute('src', 'marie.jpg');
    rerender(<ReviewCard author="Marie" hideAvatar />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.queryByText('M')).not.toBeInTheDocument();
  });

  it('leaves out stars and note when there are none', () => {
    const { container } = render(<ReviewCard author="Marie" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('p')).toBeNull();
  });

  it('expands and collapses the note with "Show more"', async () => {
    render(
      <ReviewCard author="Marie" expandable>
        A long note.
      </ReviewCard>,
    );
    const toggle = screen.getByRole('button', { name: 'Show more' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(screen.getByText('A long note.')).not.toHaveClass('clamped');
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Show less' }));
    expect(screen.getByText('A long note.')).toHaveClass('clamped');
  });

  it('has no "Show more" unless expandable', () => {
    render(<ReviewCard author="Marie">Short.</ReviewCard>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('can link the name, show actions and use another heading level', () => {
    render(
      <ReviewCard
        author="Barolo"
        authorHref="#/wines/w1"
        level={2}
        actions={<button>Edit</button>}
      />,
    );
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Barolo' })).toHaveAttribute('href', '#/wines/w1');
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('quotes the note exactly and never renders it as HTML', () => {
    const { container } = render(
      <ReviewCard author="x">{'<img src=x onerror=1>  Two  spaces'}</ReviewCard>,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('p')?.textContent).toBe('<img src=x onerror=1>  Two  spaces');
  });
});
