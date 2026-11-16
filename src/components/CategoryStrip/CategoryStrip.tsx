import { WINE_TYPES, WINE_TYPE_LABELS, type WineType } from '../../domain/types';
import styles from './CategoryStrip.module.css';

export interface CategoryItem {
  id: string;
  label: string;
  /** Shows this wine type's colour dot beside the label. */
  wine?: WineType;
}

/** The default items: the six wine types, each with its colour dot. */
export const WINE_TYPE_ITEMS: readonly CategoryItem[] = WINE_TYPES.map((type) => ({
  id: type,
  label: WINE_TYPE_LABELS[type],
  wine: type,
}));

export interface CategoryStripProps {
  /** Defaults to the six wine types. */
  items?: readonly CategoryItem[];
  /** The pressed chip, if any. One at a time. */
  active?: string | null;
  /** Called with the chosen id, or null when the pressed chip is pressed again. */
  onChange?: (id: string | null) => void;
  /** Accessible name of the group. */
  label?: string;
}

/**
 * A horizontally scrolling row of filter chips. The dot always sits beside a text
 * label: colour alone never identifies a type.
 */
export function CategoryStrip({
  items = WINE_TYPE_ITEMS,
  active = null,
  onChange,
  label = 'Filter by wine type',
}: CategoryStripProps) {
  return (
    <div role="group" aria-label={label} className={styles.strip}>
      {items.map((item) => {
        const on = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            className={styles.chip}
            aria-pressed={on}
            onClick={() => onChange?.(on ? null : item.id)}
          >
            {item.wine && <span className={styles.dot} data-type={item.wine} aria-hidden="true" />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
