import type { MouseEvent, ReactNode } from 'react';
import { Badge } from '../Badge/Badge';
import styles from './ProductTabs.module.css';

export interface ProductTab {
  id: string;
  label: string;
  /** Adds the uppercase NEW tag. */
  isNew?: boolean;
  /** Optional 32px illustration. None ships with the system. */
  icon?: ReactNode;
  /**
   * App extension: the address of the tab's page. With it the tab is a real link
   * (it can be opened in a new tab and is announced as a link); without it, a button.
   */
  href?: string;
}

export interface ProductTabsProps {
  /** Up to five tabs, in order. */
  tabs: readonly ProductTab[];
  /** The id of the current tab. */
  active?: string;
  onChange?: (id: string) => void;
  /** Accessible name of the navigation landmark. */
  label?: string;
}

/**
 * The top-level product switch, centred in the top bar. Inactive labels are muted;
 * the active tab is ink with a 2px square ink underline.
 */
export function ProductTabs({ tabs, active, onChange, label = 'Products' }: ProductTabsProps) {
  return (
    <nav aria-label={label} className={styles.tabs}>
      {tabs.map((tab) => {
        const current = tab.id === active;
        const content = (
          <>
            {tab.icon && <span className={styles.icon}>{tab.icon}</span>}
            {tab.label}
            {tab.isNew && <Badge tone="new">New</Badge>}
          </>
        );
        if (tab.href === undefined) {
          return (
            <button
              key={tab.id}
              type="button"
              className={styles.tab}
              aria-current={current ? 'page' : undefined}
              onClick={() => onChange?.(tab.id)}
            >
              {content}
            </button>
          );
        }
        const onClick = (event: MouseEvent) => {
          // Leave modified clicks (new tab, new window) to the browser.
          if (!onChange || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) {
            return;
          }
          event.preventDefault();
          onChange(tab.id);
        };
        return (
          <a
            key={tab.id}
            href={tab.href}
            className={styles.tab}
            aria-current={current ? 'page' : undefined}
            onClick={onClick}
          >
            {content}
          </a>
        );
      })}
    </nav>
  );
}
