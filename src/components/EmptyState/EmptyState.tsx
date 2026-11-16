import type { ReactNode } from 'react';
import { ButtonLink } from '../Button/Button';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  title: string;
  text?: string;
  /** Heading level: 1 when the empty state is the whole page, otherwise 2. */
  level?: 1 | 2;
  action?: { label: string; to: string };
  children?: ReactNode;
}

/** A calm message for pages or lists with nothing to show yet. */
export function EmptyState({ title, text, level = 2, action, children }: EmptyStateProps) {
  const Heading = level === 1 ? 'h1' : 'h2';
  return (
    <section className={styles.empty}>
      <Heading className={level === 1 ? 't-display-xl' : 't-display-md'}>{title}</Heading>
      {text && <p className="t-body-md">{text}</p>}
      {children}
      {action && <ButtonLink to={action.to}>{action.label}</ButtonLink>}
    </section>
  );
}
