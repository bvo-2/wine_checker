import { NavLink } from 'react-router-dom';
import styles from './ProductTabs.module.css';

export interface ProductTab {
  label: string;
  to: string;
  /** Match only the exact path (used for the home tab). */
  end?: boolean;
}

export interface ProductTabsProps {
  tabs: readonly ProductTab[];
  /** Accessible name of the navigation landmark. */
  label?: string;
  /** compact: the scrolling row used under the top bar on phones. */
  variant?: 'default' | 'compact';
}

/** The product's main sections. The current section is marked with aria-current="page". */
export function ProductTabs({ tabs, label = 'Sections', variant = 'default' }: ProductTabsProps) {
  return (
    <nav aria-label={label} className={[styles.tabs, styles[variant]].join(' ')}>
      {tabs.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end} className={styles.tab}>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
