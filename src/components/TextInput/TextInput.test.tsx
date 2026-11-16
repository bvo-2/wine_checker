import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select, TextArea, TextInput } from './TextInput';

describe('TextInput', () => {
  it('links the label to the input', async () => {
    const onChange = vi.fn();
    render(<TextInput label="Wine name" onChange={onChange} />);
    const input = screen.getByLabelText('Wine name');
    await userEvent.type(input, 'Barolo');
    expect(input).toHaveValue('Barolo');
    expect(onChange).toHaveBeenCalled();
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('shows a hint and describes the input with it', () => {
    render(<TextInput label="Grapes" hint="Separate with commas" />);
    expect(screen.getByLabelText('Grapes')).toHaveAccessibleDescription('Separate with commas');
  });

  it('shows the error state and replaces the hint with the message', () => {
    render(<TextInput label="Vintage" hint="A year" error="Enter a year from 1800" />);
    const input = screen.getByLabelText('Vintage');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter a year from 1800');
    expect(screen.queryByText('A year')).not.toBeInTheDocument();
  });

  it('marks optional fields in the label', () => {
    render(<TextInput label="Producer" optional />);
    expect(screen.getByText('(optional)')).toBeInTheDocument();
    expect(screen.getByLabelText(/Producer/)).toBeInTheDocument();
  });

  it('cannot be typed in when disabled', async () => {
    render(<TextInput label="Wine name" disabled />);
    const input = screen.getByLabelText('Wine name');
    await userEvent.type(input, 'x');
    expect(input).toBeDisabled();
    expect(input).toHaveValue('');
  });

  it('takes focus from the keyboard', async () => {
    render(<TextInput label="Wine name" />);
    await userEvent.tab();
    expect(screen.getByLabelText('Wine name')).toHaveFocus();
  });
});

describe('TextArea', () => {
  it('renders a labelled textarea with an error state', () => {
    render(<TextArea label="Note" error="Too long" />);
    const area = screen.getByLabelText('Note');
    expect(area.tagName).toBe('TEXTAREA');
    expect(area).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('Select', () => {
  it('renders a labelled select and reports changes', async () => {
    const onChange = vi.fn();
    render(
      <Select label="Type" onChange={onChange} defaultValue="">
        <option value="">Not set</option>
        <option value="red">Red</option>
      </Select>,
    );
    await userEvent.selectOptions(screen.getByLabelText('Type'), 'red');
    expect(screen.getByLabelText('Type')).toHaveValue('red');
    expect(onChange).toHaveBeenCalledOnce();
  });
});
