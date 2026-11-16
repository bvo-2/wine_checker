import { useId, useState } from 'react';
import { Icon } from '../Icon/Icon';
import styles from './Rating.module.css';

export interface RatingProps {
  /** The number of stars, 0 or undefined when there is none yet. */
  value?: number;
  /** Number of stars in the scale. */
  max?: number;
  /** md: the 24px input. sm: the 12px read-only row for cards and reviews. */
  size?: 'md' | 'sm';
  /** Display only. Rounds to the nearest whole star. */
  readOnly?: boolean;
  /** Prints the number, with one decimal, beside the stars. */
  showValue?: boolean;
  /** Spoken label of the input, e.g. "Your rating". */
  label?: string;
  /** Receives 1 to max. */
  onChange?: (value: number) => void;
  /** App extension: validation message; sets the error state. */
  error?: string;
  /** App extension: marks the input as required for assistive technology. */
  required?: boolean;
  /** App extension. */
  disabled?: boolean;
}

/**
 * The star scale: the input used to rate a wine, and the compact read-only row.
 * Stars are always star-rating (ink), never gold.
 */
export function Rating({
  value = 0,
  max = 5,
  size = 'md',
  readOnly = false,
  showValue = false,
  label,
  onChange,
  error,
  required = false,
  disabled = false,
}: RatingProps) {
  const id = useId();
  const [preview, setPreview] = useState(0);

  if (readOnly || size === 'sm') {
    const whole = Math.round(value);
    return (
      <span
        className={styles.readonly}
        role="img"
        aria-label={`${label ? `${label}: ` : ''}${value.toFixed(1)} out of ${max} stars`}
      >
        {Array.from({ length: max }, (_, index) => (
          <Icon
            key={index}
            name={index < whole ? 'star-filled' : 'star'}
            size={size === 'sm' ? 12 : 24}
          />
        ))}
        {showValue && <span className={styles.value}>{value.toFixed(1)}</span>}
      </span>
    );
  }

  const shown = preview || value;
  return (
    <div className={styles.rating}>
      <div
        role="group"
        aria-label={`${label ?? 'Rating'}${required ? ', required' : ''}`}
        aria-describedby={error ? `${id}-error` : undefined}
        className={styles.stars}
        data-invalid={error ? 'true' : undefined}
        onMouseLeave={() => setPreview(0)}
      >
        {Array.from({ length: max }, (_, index) => {
          const stars = index + 1;
          return (
            <button
              key={stars}
              type="button"
              className={styles.star}
              aria-label={`${stars} ${stars === 1 ? 'star' : 'stars'}`}
              aria-pressed={value === stars}
              disabled={disabled}
              onMouseEnter={() => setPreview(stars)}
              onClick={() => onChange?.(stars)}
            >
              <Icon name={stars <= shown ? 'star-filled' : 'star'} size={24} />
            </button>
          );
        })}
        {showValue && value > 0 && <span className={styles.value}>{value.toFixed(1)}</span>}
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
