import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductTabs, type ProductTab } from './ProductTabs';

const TABS: ProductTab[] = [
  { id: 'wines', label: 'Wines', href: '#/' },
  { id: 'wineries', label: 'Wineries', href: '#/wineries' },
  { id: 'regions', label: 'Regions', href: '#/regions' },
];

function Controlled({ onChange = () => {} }: { onChange?: (id: string) => void }) {
  const [active, setActive] = useState('wines');
  return (
    <ProductTabs
      tabs={TABS}
      active={active}
      onChange={(id) => {
        setActive(id);
        onChange(id);
      }}
    />
  );
}

describe('ProductTabs', () => {
  it('renders every tab as a link inside a labelled navigation', () => {
    render(<ProductTabs tabs={TABS} active="wines" label="Sections" />);
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeInTheDocument();
    expect(screen.getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')])).toEqual(
      [
        ['Wines', '#/'],
        ['Wineries', '#/wineries'],
        ['Regions', '#/regions'],
      ],
    );
  });

  it('marks only the active tab', () => {
    render(<ProductTabs tabs={TABS} active="wineries" />);
    expect(screen.getByRole('link', { name: 'Wineries' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Wines' })).not.toHaveAttribute('aria-current');
  });

  it('marks nothing when no tab is active', () => {
    render(<ProductTabs tabs={TABS} />);
    for (const link of screen.getAllByRole('link'))
      expect(link).not.toHaveAttribute('aria-current');
  });

  it('reports the chosen tab and moves the marker', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    await userEvent.click(screen.getByRole('link', { name: 'Regions' }));
    expect(onChange).toHaveBeenCalledWith('regions');
    expect(screen.getByRole('link', { name: 'Regions' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Wines' })).not.toHaveAttribute('aria-current');
  });

  it('leaves ctrl-click to the browser so a tab can open in a new window', async () => {
    const onChange = vi.fn();
    render(<ProductTabs tabs={TABS} active="wines" onChange={onChange} />);
    const user = userEvent.setup();
    await user.keyboard('{Control>}');
    await user.click(screen.getByRole('link', { name: 'Regions' }));
    await user.keyboard('{/Control}');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('is reachable and usable with the keyboard', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    await userEvent.tab();
    expect(screen.getByRole('link', { name: 'Wines' })).toHaveFocus();
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('wineries');
  });

  it('renders buttons when tabs have no address', async () => {
    const onChange = vi.fn();
    render(
      <ProductTabs
        tabs={[
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' },
        ]}
        active="a"
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(onChange).toHaveBeenCalledWith('b');
    expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute('aria-current', 'page');
  });

  it('shows the NEW tag and an icon when asked', () => {
    render(
      <ProductTabs
        tabs={[{ id: 'a', label: 'Tastings', isNew: true, icon: <svg data-testid="icon" /> }]}
      />,
    );
    expect(screen.getByText('New')).toHaveClass('new');
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});
