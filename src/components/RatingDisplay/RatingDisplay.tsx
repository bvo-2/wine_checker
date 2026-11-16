import { RatingStars } from '../Rating/Rating';
import styles from './RatingDisplay.module.css';

export interface RatingDisplayStat {
  label: string;
  value: string;
}

export interface RatingDisplayProps {
  /** The score, 1 to 5. Leave undefined when there is nothing to show yet. */
  value?: number;
  /** Short line under the stars, e.g. "Average of 3 tastings". */
  label?: string;
  description?: string;
  /** Up to three figures shown in a row underneath. */
  stats?: readonly RatingDisplayStat[];
}

/** The big rating number (Fraunces) with stars and supporting figures. */
export function RatingDisplay({ value, label, description, stats = [] }: RatingDisplayProps) {
  return (
    <div className={styles.display}>
      {value === undefined ? (
        <p className={styles.number} aria-label="Not rated yet">
          –
        </p>
      ) : (
        <>
          <p className={styles.number}>{value.toFixed(1)}</p>
          <RatingStars value={value} size={16} />
        </>
      )}
      {label && <p className={styles.label}>{label}</p>}
      {description && <p className={styles.description}>{description}</p>}
      {stats.length > 0 && (
        <dl className={styles.stats}>
          {stats.slice(0, 3).map((stat) => (
            <div key={stat.label} className={styles.stat}>
              <dt className={styles.statLabel}>{stat.label}</dt>
              <dd className={styles.statValue}>{stat.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
