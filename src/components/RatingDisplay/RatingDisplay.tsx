import { Rating } from '../Rating/Rating';
import styles from './RatingDisplay.module.css';

export interface RatingDisplayStat {
  label: string;
  value: string;
}

export interface RatingDisplayProps {
  /** The score, 1 to 5. */
  value: number;
  /** Short line under the stars, e.g. "Average of 3 tastings". */
  label?: string;
  /** One line of context. */
  description?: string;
  /** Up to three figures shown in a hairline-separated row. */
  stats?: readonly RatingDisplayStat[];
}

/**
 * The one typographically loud moment: the score at 64px in the display serif,
 * centred, with a small star row and supporting figures. Use once per page.
 */
export function RatingDisplay({ value, label, description, stats = [] }: RatingDisplayProps) {
  return (
    <div className={styles.display}>
      <p className={styles.number}>{value.toFixed(1)}</p>
      <Rating size="sm" value={value} />
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
