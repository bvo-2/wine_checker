import { Icon } from "./Icon";
import { formatScore } from "@/lib/types";

/** Read-only compact star row (12px), rounded to the nearest whole star. */
export function RatingStars({ value, max = 5, showValue, size = 12 }: { value: number; max?: number; showValue?: boolean; size?: number }) {
  const whole = Math.round(value);
  return (
    <span className="dc-rating-row" role="img" aria-label={`${formatScore(value)} out of ${max} stars`}>
      <span className="dc-rating dc-rating--sm" aria-hidden="true">
        {Array.from({ length: max }, (_, i) => (
          <Icon key={i} name={i < whole ? "star-filled" : "star"} size={size} />
        ))}
      </span>
      {showValue && <span className="t-caption">{formatScore(value)}</span>}
    </span>
  );
}

/**
 * Interactive rating input. Each star is a submit button for the given server action,
 * so a bare star tap saves on its own (works without client JavaScript).
 * Hover previews are pure CSS.
 */
export function RatingInput({
  value,
  action,
  hidden,
  label = "Your rating",
}: {
  value: number | null;
  action: (formData: FormData) => void | Promise<void>;
  hidden: Record<string, string>;
  label?: string;
}) {
  const stars = [5, 4, 3, 2, 1]; // row-reverse: DOM order high→low, displayed low→high
  return (
    <form action={action}>
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
        <legend className="sr-only">{label}</legend>
        <div className="dc-rating">
          {stars.map((n) => (
            <button
              key={n}
              type="submit"
              name="score"
              value={n}
              className={`dc-rating__star${value != null && n <= value ? " is-on" : ""}`}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={value === n}
            >
              <Icon name="star" size={24} />
            </button>
          ))}
        </div>
      </fieldset>
    </form>
  );
}

export function RatingDisplay({
  value,
  label,
  description,
  stats = [],
}: {
  value: number;
  label?: string;
  description?: string;
  stats?: { label: string; value: string }[];
}) {
  return (
    <div className="dc-rating-display">
      <div className="t-rating-display">{formatScore(value)}</div>
      <RatingStars value={value} size={14} />
      {label && <div className="t-title-md dc-rating-display__label">{label}</div>}
      {description && <div className="t-body-sm t-muted">{description}</div>}
      {stats.length > 0 && (
        <div className="dc-rating-display__stats">
          {stats.slice(0, 3).map((s) => (
            <div key={s.label}>
              <div className="t-title-md">{s.value}</div>
              <div className="t-body-sm t-muted">{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
