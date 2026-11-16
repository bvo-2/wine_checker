import type { WineType } from '../../domain/types';

/** Placeholder bottle shown when a wine has no photo, in the wine type's colour. */
export function BottleSilhouette({ type, className }: { type?: WineType; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 120"
      aria-hidden="true"
      focusable="false"
      data-wine-type={type ?? 'unknown'}
    >
      <path
        fill={type ? `var(--wine-${type})` : 'var(--muted-soft)'}
        d="M16 2h8v4h-1v22c0 4 9 10 9 22v62c0 3-2 6-6 6H14c-4 0-6-3-6-6V50c0-12 9-18 9-22V6h-1z"
      />
    </svg>
  );
}
