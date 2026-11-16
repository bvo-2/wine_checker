import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

function renderDialog(overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmDialog
      open
      title="Delete this wine?"
      confirmLabel="Delete wine"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    >
      Barolo and its 2 tastings will be deleted.
    </ConfirmDialog>,
  );
  return { onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
  it('is an alert dialog that explains the action', () => {
    renderDialog();
    const dialog = screen.getByRole('alertdialog', { name: 'Delete this wine?' });
    expect(dialog).toHaveTextContent('Barolo and its 2 tastings will be deleted.');
  });

  it('confirms only when the confirm button is pressed', async () => {
    const { onConfirm, onCancel } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Delete wine' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('cancels with the Cancel button or Escape, without confirming', async () => {
    const { onConfirm, onCancel } = renderDialog();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('renders nothing when closed', () => {
    renderDialog({ open: false });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('uses the danger style for destructive actions', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: 'Delete wine' })).toHaveClass('danger');
  });
});
