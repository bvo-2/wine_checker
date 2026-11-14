import Link from "next/link";
import { BottleSilhouette, Icon } from "./Icon";
import { formatScore, wineTypeLabel, type WineType } from "@/lib/types";
import { toggleSaveAction } from "@/app/actions";

export interface WineCardData {
  id: string;
  title: string;
  producer?: string | null;
  region?: string | null;
  vintage?: number | null;
  wine?: WineType | null;
  rating?: number | null;
  ratingCount?: number | null;
  ratingLabel?: string;
  badge?: string;
  badgeTone?: "neutral" | "primary" | "reserve";
  image?: string | null;
  saved: boolean;
  /** Fields posted to the save action so a search result can be stored without another lookup. */
  savePayload: string;
}

export function WineCard(w: WineCardData) {
  const typeLabel = wineTypeLabel(w.wine ?? undefined);
  const vintageLine = [w.vintage ?? "NV", typeLabel].filter(Boolean).join(" · ");
  const place = [w.producer, w.region].filter(Boolean).join(" · ");
  return (
    <article className="dc-wine-card">
      <Link href={`/wines/${w.id}`} className="dc-wine-card__link">
        <div className="dc-plate">
          {w.image ? <img src={w.image} alt={`Bottle of ${w.title}`} loading="lazy" /> : <BottleSilhouette type={w.wine} />}
        </div>
        <div className="dc-wine-card__meta">
          <div className="dc-wine-card__title-row">
            <span className="t-title-md dc-wine-card__title">{w.title}</span>
            {w.rating != null && (
              <span className="dc-wine-card__score" aria-label={`${w.ratingLabel ?? "Rating"} ${formatScore(w.rating)}`}>
                <Icon name="star-filled" size={12} />
                {formatScore(w.rating)}
                {w.ratingCount ? <span className="t-muted" style={{ fontWeight: 400 }}>({w.ratingCount})</span> : null}
              </span>
            )}
          </div>
          {place && <div className="t-body-sm dc-wine-card__line">{place}</div>}
          <div className="t-body-sm dc-wine-card__line">
            {w.wine && <span className={`dc-dot dc-dot--${w.wine}`} aria-hidden="true" />}
            {vintageLine}
          </div>
        </div>
      </Link>
      {w.badge && (
        <span className={`dc-badge dc-badge--${w.badgeTone ?? "neutral"} dc-badge--floating dc-wine-card__badge`}>{w.badge}</span>
      )}
      <form action={toggleSaveAction} className="dc-wine-card__save">
        <input type="hidden" name="payload" value={w.savePayload} />
        <input type="hidden" name="saved" value={w.saved ? "1" : "0"} />
        <button
          type="submit"
          className="dc-icon-button"
          aria-pressed={w.saved}
          aria-label={w.saved ? `Remove ${w.title} from cellar` : `Save ${w.title} to cellar`}
        >
          <Icon name={w.saved ? "heart-filled" : "heart"} size={16} />
        </button>
      </form>
    </article>
  );
}
