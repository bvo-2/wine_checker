import type { ReactNode } from 'react';
import styles from './Badge.module.css';

export type BadgeTone = 'neutral' | 'primary' | 'reserve' | 'new';

export interface BadgeProps {
  /** neutral: plain label. primary: brand tint. reserve: outlined accent. new: small uppercase flag. */
  tone?: BadgeTone;
  /** Adds the floating shadow, for badges placed over a card image. */
  floating?: boolean;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', floating = false, children }: BadgeProps) {
  const className = [styles.badge, styles[tone], floating && styles.floating]
    .filter(Boolean)
    .join(' ');
  return <span className={className}>{children}</span>;
}
