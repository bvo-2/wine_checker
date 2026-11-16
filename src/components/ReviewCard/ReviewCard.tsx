import type { ReactNode } from 'react';
import { RatingStars } from '../Rating/Rating';
import styles from './ReviewCard.module.css';

export interface ReviewCardProps {
  /** Heading of the card: for my own tastings, the date. */
  title: string;
  /** Optional line above the title, e.g. the wine name on the Tastings page. */
  eyebrow?: ReactNode;
  stars: number;
  /** The tasting note. Line breaks are kept. */
  note?: string;
  /** Short facts shown under the title, e.g. place and price. */
  meta?: readonly string[];
  /** Buttons or links, e.g. Edit and Delete. */
  actions?: ReactNode;
  /** Heading level of the title. */
  level?: 2 | 3 | 4;
}

/** One tasting note: when, how many stars, what I thought. */
export function ReviewCard({
  title,
  eyebrow,
  stars,
  note,
  meta = [],
  actions,
  level = 3,
}: ReviewCardProps) {
  const Heading = `h${level}` as const;
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <div className={styles.heading}>
          {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
          <Heading className={styles.title}>{title}</Heading>
          {meta.length > 0 && <p className={styles.meta}>{meta.join(' · ')}</p>}
        </div>
        <RatingStars value={stars} size={16} />
      </header>
      {note ? (
        <p className={styles.note}>{note}</p>
      ) : (
        <p className={styles.noNote}>No note for this tasting.</p>
      )}
      {actions && <div className={styles.actions}>{actions}</div>}
    </article>
  );
}
