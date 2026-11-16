import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders its text with the neutral tone by default', () => {
    render(<Badge>3 tastings</Badge>);
    expect(screen.getByText('3 tastings')).toHaveClass('badge', 'neutral');
  });

  it.each(['neutral', 'primary', 'reserve', 'new'] as const)('applies the %s tone', (tone) => {
    render(<Badge tone={tone}>Label</Badge>);
    expect(screen.getByText('Label')).toHaveClass(tone);
  });

  it('adds the floating style on request', () => {
    render(<Badge floating>Label</Badge>);
    expect(screen.getByText('Label')).toHaveClass('floating');
  });
});
