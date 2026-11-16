import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Button, ButtonLink } from './Button';

describe('Button', () => {
  it('renders a button with type="button" by default and handles clicks', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('button', 'primary');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it.each(['primary', 'secondary', 'tertiary', 'danger'] as const)(
    'applies the %s variant',
    (variant) => {
      render(<Button variant={variant}>Go</Button>);
      expect(screen.getByRole('button')).toHaveClass(variant);
    },
  );

  it('does not fire clicks when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is busy and blocks clicks while loading', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Saving
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Saving' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('can be focused with the keyboard and activated with Enter', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await userEvent.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('fills the width when block', () => {
    render(<Button block>Save</Button>);
    expect(screen.getByRole('button')).toHaveClass('block');
  });
});

describe('ButtonLink', () => {
  it('renders a link styled as a button', () => {
    render(
      <MemoryRouter>
        <ButtonLink to="/wines/new" variant="secondary">
          Add a wine
        </ButtonLink>
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: 'Add a wine' });
    expect(link).toHaveAttribute('href', '/wines/new');
    expect(link).toHaveClass('button', 'secondary');
  });
});
