import type { ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Field.module.css';

export interface FieldProps {
  /** Visible label. Every field has one. */
  label: string;
  /** Validation message. Sets the error state. */
  error?: string;
  /** Helper text shown under the control. */
  hint?: string;
  /** Marks the field as optional next to the label. */
  optional?: boolean;
}

export interface FieldIds {
  id: string;
  hintId: string;
  errorId: string;
}

export function describedBy(ids: FieldIds, props: FieldProps): string | undefined {
  const list = [props.error && ids.errorId, props.hint && ids.hintId].filter(Boolean);
  return list.length > 0 ? list.join(' ') : undefined;
}

/** Label, hint and error message around a form control. */
export function Field({
  ids,
  label,
  error,
  hint,
  optional,
  children,
}: FieldProps & { ids: FieldIds; children: ReactNode }) {
  return (
    <div className={styles.field}>
      <label htmlFor={ids.id} className={styles.label}>
        {label}
        {optional && <span className={styles.optional}> (optional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={ids.hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={ids.errorId} className={styles.error}>
          <Icon name="alert" size={16} />
          {error}
        </p>
      )}
    </div>
  );
}

export { styles as fieldStyles };
