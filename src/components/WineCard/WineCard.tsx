import { Link } from 'react-router-dom';
import { Badge, type BadgeTone } from '../Badge/Badge';
import { Icon } from '../Icon/Icon';
import { formatScore, vintageLine } from '../../domain/format';
import type { WineType } from '../../domain/types';
import { BottleSilhouette } from './BottleSilhouette';
import styles from './WineCard.module.css';

export interface WineCardProps {
  /** Where the card links to. */
  to: string;
  name: string;
  producer?: string;
  region?: string;
  vintage?: number;
  type?: WineType;
  /** Stars to show next to the name, 1 to 5. Left out when the wine is unrated. */
  rating?: number;
  /** What the rating is, for screen readers, e.g. "Latest rating". */
  ratingLabel?: string;
  /** Small label over the image, e.g. "3 tastings". */
  badge?: string;
  badgeTone?: BadgeTone;
  /** Bottle photo. Without one, a silhouette in the wine type's colour is shown. */
  imageUrl?: string;
}

export function WineCard({
  to,
  name,
  producer,
  region,
  vintage,
  type,
  rating,
  ratingLabel = 'Rating',
  badge,
  badgeTone = 'neutral',
  imageUrl,
}: WineCardProps) {
  const origin = [producer, region].filter(Boolean).join(' · ');
  return (
    <article className={styles.card}>
      <Link to={to} className={styles.link}>
        <div className={styles.plate}>
          {imageUrl ? (
            <img src={imageUrl} alt="" loading="lazy" className={styles.photo} />
          ) : (
            <BottleSilhouette type={type} className={styles.silhouette} />
          )}
        </div>
        <div className={styles.meta}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>{name}</h3>
            {rating !== undefined && (
              <span className={styles.score}>
                <Icon name="star-filled" size={12} />
                <span className="sr-only">{ratingLabel}: </span>
                {formatScore(rating)}
              </span>
            )}
          </div>
          {origin && <p className={styles.line}>{origin}</p>}
          <p className={styles.line}>
            {type && <span className={styles.dot} data-type={type} aria-hidden="true" />}
            {vintageLine({ vintage, type })}
          </p>
        </div>
      </Link>
      {badge && (
        <span className={styles.badge}>
          <Badge tone={badgeTone} floating>
            {badge}
          </Badge>
        </span>
      )}
    </article>
  );
}
