import { useId, useState } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Rating.module.css';

export interface RatingProps {
  /** Visible label of the group, e.g. "Your rating". */
  label: string;
  /** The chosen number of stars; 0 or undefined when nothing is chosen yet. */
  value?: number;
  onChange: (stars: number) => void;
  /** Number of stars. */
  max?: number;
  /** Name of the underlying radio inputs. */
  name?: string;
  required?: boolean;
  disabled?: boolean;
  /** Validation message. Sets the error state. */
  error?: string;
}

/**
 * Star rating input. It is a radio group, so it works with arrow keys and screen
 * readers. Stars are ink-coloured, never gold.
 */
export function Rating({
  label,
  value = 0,
  onChange,
  max = 5,
  name,
  required = false,
  disabled = false,
  error,
}: RatingProps) {
  const id = useId();
  const [preview, setPreview] = useState(0);
  const shown = preview || value;
  const radioName = name ?? `rating-${id}`;

  return (
    <div className={styles.rating}>
      <span id={`${id}-label`} className={styles.label}>
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        className={styles.stars}
        onMouseLeave={() => setPreview(0)}
      >
        {Array.from({ length: max }, (_, index) => {
          const stars = index + 1;
          return (
            <label
              key={stars}
              className={styles.star}
              onMouseEnter={() => !disabled && setPreview(stars)}
            >
              <input
                type="radio"
                className="sr-only"
                name={radioName}
                value={stars}
                checked={value === stars}
                disabled={disabled}
                onChange={() => onChange(stars)}
                aria-label={`${stars} ${stars === 1 ? 'star' : 'stars'}`}
              />
              <Icon name={stars <= shown ? 'star-filled' : 'star'} size={28} />
            </label>
          );
        })}
        <span className={styles.value} aria-hidden="true">
          {value > 0 ? `${value} of ${max}` : ''}
        </span>
      </div>
      {error && (
        <p id={`${id}-error`} className={styles.error}>
          <Icon name="alert" size={16} />
          {error}
        </p>
      )}
    </div>
  );
}

export interface RatingStarsProps {
  /** 0 to max; shown rounded to the nearest whole star. */
  value: number;
  max?: number;
  /** Star size in CSS pixels. */
  size?: number;
  /** Also print the number, with one decimal. */
  showValue?: boolean;
}

/** Read-only row of stars. */
export function RatingStars({ value, max = 5, size = 14, showValue = false }: RatingStarsProps) {
  const whole = Math.round(value);
  return (
    <span
      className={styles.readonly}
      role="img"
      aria-label={`${value.toFixed(1)} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, index) => (
        <Icon key={index} name={index < whole ? 'star-filled' : 'star'} size={size} />
      ))}
      {showValue && <span className={styles.readonlyValue}>{value.toFixed(1)}</span>}
    </span>
  );
}
