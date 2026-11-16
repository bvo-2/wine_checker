import { useState, type ReactNode } from 'react';
import { Button } from '../Button/Button';
import { Rating } from '../Rating/Rating';
import styles from './ReviewCard.module.css';

export interface ReviewCardProps {
  /** Who (or, for my own tastings, what) the note is about; shown as the name. */
  author: string;
  /** Shown under the name. */
  date?: string;
  /** Image address for the 40px round avatar. Without it, the author's initials. */
  avatar?: string;
  rating?: number;
  /** Adds the "Show more" link that lifts the three-line clamp. */
  expandable?: boolean;
  /** The tasting note, quoted exactly. */
  children?: ReactNode;
  /** App extension: hide the avatar, for notes that are all my own. */
  hideAvatar?: boolean;
  /** App extension: makes the name a link, e.g. to the wine. */
  authorHref?: string;
  /** App extension: buttons or links such as Edit and Delete. */
  actions?: ReactNode;
  /** App extension: heading level of the name. */
  level?: 2 | 3 | 4;
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/**
 * A tasting note: author row, small read-only stars, and a three-line clamped
 * excerpt with a "Show more" link. No card surface; it sits straight on canvas.
 */
export function ReviewCard({
  author,
  date,
  avatar,
  rating,
  expandable = false,
  children,
  hideAvatar = false,
  authorHref,
  actions,
  level = 3,
}: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const Heading = `h${level}` as const;
  return (
    <article className={styles.review}>
      <header className={styles.author}>
        {!hideAvatar &&
          (avatar ? (
            <img src={avatar} alt="" className={styles.avatar} />
          ) : (
            <span className={styles.avatar} aria-hidden="true">
              {initials(author)}
            </span>
          ))}
        <div className={styles.who}>
          <Heading className={styles.name}>
            {authorHref ? <a href={authorHref}>{author}</a> : author}
          </Heading>
          {date && <p className={styles.date}>{date}</p>}
        </div>
      </header>
      {rating !== undefined && <Rating size="sm" value={rating} />}
      {children && (
        <p className={expanded ? styles.note : `${styles.note} ${styles.clamped}`}>{children}</p>
      )}
      {(expandable || actions) && (
        <div className={styles.actions}>
          {expandable && (
            <Button
              variant="tertiary"
              aria-expanded={expanded}
              onClick={() => setExpanded((open) => !open)}
            >
              {expanded ? 'Show less' : 'Show more'}
            </Button>
          )}
          {actions}
        </div>
      )}
    </article>
  );
}
