import { Link } from 'react-router-dom';
import { Badge, type BadgeTone } from '../Badge/Badge';
import { Icon } from '../Icon/Icon';
import { IconButton } from '../IconButton/IconButton';
import { WINE_TYPE_LABELS, type WineType } from '../../domain/types';
import { BottleSilhouette } from './BottleSilhouette';
import styles from './WineCard.module.css';

export interface WineCardProps {
  title: string;
  producer?: string;
  region?: string;
  /** Shown as "NV" when missing. */
  vintage?: string | number;
  wine?: WineType;
  /** e.g. "€38". */
  price?: string;
  /** e.g. "bottle". */
  priceUnit?: string;
  /** Score shown beside the title, with one decimal. */
  rating?: number;
  /** Number of ratings behind the score, shown muted in brackets. */
  ratingCount?: number;
  /** Floating badge top-left. One per card, two words at most. */
  badge?: string;
  badgeTone?: BadgeTone;
  /** Bottle shot, cropped 4:5. Without it, a silhouette in the wine type's colour. */
  image?: string;
  imageAlt?: string;
  saved?: boolean;
  /** Shows the save heart top-right and receives the new state. */
  onSave?: (saved: boolean) => void;
  /** App extension: where the card links to. */
  to?: string;
  /** App extension: what the score is, for screen readers. */
  ratingLabel?: string;
}

/** A photo-first wine tile: 4:5 plate, floating badge, save heart, then lines of meta. */
export function WineCard({
  title,
  producer,
  region,
  vintage,
  wine,
  price,
  priceUnit,
  rating,
  ratingCount,
  badge,
  badgeTone = 'neutral',
  image,
  imageAlt,
  saved = false,
  onSave,
  to,
  ratingLabel = 'Rating',
}: WineCardProps) {
  const origin = [producer, region].filter(Boolean).join(' · ');
  const body = (
    <>
      <div className={styles.plate}>
        {image ? (
          <img
            src={image}
            alt={imageAlt ?? `Bottle of ${title}`}
            loading="lazy"
            className={styles.photo}
          />
        ) : (
          <BottleSilhouette type={wine} className={styles.silhouette} />
        )}
      </div>
      <div className={styles.meta}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{title}</h3>
          {rating !== undefined && (
            <span className={styles.score}>
              <Icon name="star-filled" size={12} />
              <span className="sr-only">{ratingLabel}: </span>
              {rating.toFixed(1)}
              {ratingCount !== undefined && <span className={styles.count}>({ratingCount})</span>}
            </span>
          )}
        </div>
        {origin && <p className={styles.line}>{origin}</p>}
        <p className={styles.line}>
          {wine && <span className={styles.dot} data-type={wine} aria-hidden="true" />}
          {[vintage ?? 'NV', wine && WINE_TYPE_LABELS[wine]].filter(Boolean).join(' · ')}
        </p>
        {price && (
          <p className={styles.price}>
            <strong>{price}</strong>
            {priceUnit ? ` ${priceUnit}` : ''}
          </p>
        )}
      </div>
    </>
  );

  return (
    <article className={styles.card}>
      {to ? (
        <Link to={to} className={styles.link}>
          {body}
        </Link>
      ) : (
        <div className={styles.link}>{body}</div>
      )}
      {badge && (
        <Badge tone={badgeTone} floating className={styles.badge}>
          {badge}
        </Badge>
      )}
      {onSave && (
        <IconButton
          icon={saved ? 'heart-filled' : 'heart'}
          label={saved ? `Remove ${title} from cellar` : `Save ${title} to cellar`}
          aria-pressed={saved}
          className={styles.save}
          onClick={() => onSave(!saved)}
        />
      )}
    </article>
  );
}
