import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Field, describedBy, fieldStyles, type FieldIds, type FieldProps } from './Field';

function useFieldIds(id?: string): FieldIds {
  const auto = useId();
  const base = id ?? auto;
  return { id: base, hintId: `${base}-hint`, errorId: `${base}-error` };
}

export interface TextInputProps
  extends FieldProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'aria-invalid'> {}

/** Single-line text field with label, optional hint and error state. */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, error, hint, optional, id, className, ...rest },
  ref,
) {
  const ids = useFieldIds(id);
  const field = { label, error, hint, optional };
  return (
    <Field ids={ids} {...field}>
      <input
        type="text"
        {...rest}
        ref={ref}
        id={ids.id}
        className={[fieldStyles.control, className].filter(Boolean).join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(ids, field)}
      />
    </Field>
  );
});

export interface TextAreaProps
  extends FieldProps, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'aria-invalid'> {}

/** Multi-line variant of TextInput. */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, error, hint, optional, id, className, ...rest },
  ref,
) {
  const ids = useFieldIds(id);
  const field = { label, error, hint, optional };
  return (
    <Field ids={ids} {...field}>
      <textarea
        {...rest}
        ref={ref}
        id={ids.id}
        className={[fieldStyles.control, fieldStyles.textarea, className].filter(Boolean).join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(ids, field)}
      />
    </Field>
  );
});

export interface SelectProps
  extends FieldProps, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'aria-invalid'> {}

/** Native select styled like TextInput. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, optional, id, className, children, ...rest },
  ref,
) {
  const ids = useFieldIds(id);
  const field = { label, error, hint, optional };
  return (
    <Field ids={ids} {...field}>
      <select
        {...rest}
        ref={ref}
        id={ids.id}
        className={[fieldStyles.control, fieldStyles.select, className].filter(Boolean).join(' ')}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(ids, field)}
      >
        {children}
      </select>
    </Field>
  );
});
