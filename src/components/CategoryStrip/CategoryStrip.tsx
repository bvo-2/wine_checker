import styles from './CategoryStrip.module.css';

export interface Category<Id extends string = string> {
  id: Id;
  label: string;
  /** Optional colour dot: the name of a wine type token, e.g. "red" → --wine-red. */
  dot?: string;
}

export interface CategoryStripProps<Id extends string = string> {
  /** Accessible name of the group, e.g. "Filter by wine type". */
  label: string;
  categories: readonly Category<Id>[];
  /** The selected category, if any. One at most. */
  active?: Id;
  /** Called with the chosen id, or undefined when the active chip is pressed again. */
  onChange: (id: Id | undefined) => void;
}

/** A scrolling row of filter chips. Pressing the active chip clears the filter. */
export function CategoryStrip<Id extends string = string>({
  label,
  categories,
  active,
  onChange,
}: CategoryStripProps<Id>) {
  return (
    <div role="group" aria-label={label} className={styles.strip}>
      {categories.map((category) => {
        const on = category.id === active;
        return (
          <button
            key={category.id}
            type="button"
            className={styles.chip}
            aria-pressed={on}
            onClick={() => onChange(on ? undefined : category.id)}
          >
            {category.dot && (
              <span className={styles.dot} data-type={category.dot} aria-hidden="true" />
            )}
            {category.label}
          </button>
        );
      })}
    </div>
  );
}
