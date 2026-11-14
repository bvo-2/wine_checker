import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { noteAction, rateAction, removeAction, toggleSaveAction } from "@/app/actions";
import { Footer, TopBar } from "@/components/Chrome";
import { BottleSilhouette, Icon } from "@/components/Icon";
import { RatingDisplay, RatingInput } from "@/components/Rating";
import { getCellarWine } from "@/lib/db";
import { payloadFromCellar, payloadFromDetail } from "@/lib/payload";
import { formatScore, toWineType, wineTypeLabel, type CellarWine } from "@/lib/types";
import { getWine, isWineApiId, pairingLabels, type WineDetail } from "@/lib/wineapi";

export const dynamic = "force-dynamic";

async function load(id: string): Promise<{ detail: WineDetail | null; cellar: CellarWine | null; apiFailed: boolean }> {
  const cellar = getCellarWine(id);
  let detail: WineDetail | null = null;
  let apiFailed = false;
  if (isWineApiId(id)) {
    try {
      detail = await getWine(id);
    } catch {
      apiFailed = true;
    }
  }
  return { detail, cellar, apiFailed };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const cellar = getCellarWine(id);
  return { title: cellar?.name ?? "Wine" };
}

function money(n: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${currency} ${Math.round(n)}`;
  }
}

function date(s: string | null) {
  if (!s) return null;
  const d = new Date(s.includes("T") ? s : `${s.replace(" ", "T")}Z`);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function WinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { detail, cellar, apiFailed } = await load(id);
  if (!detail && !cellar) notFound();

  const name = detail?.name ?? cellar!.name;
  const winery = detail?.winery?.name ?? cellar?.winery ?? null;
  const region = detail?.region?.name ?? cellar?.region ?? null;
  const country = detail?.region?.country ?? cellar?.country ?? null;
  const vintage = detail?.vintage ?? cellar?.vintage ?? null;
  const type = toWineType(detail?.type) ?? cellar?.type ?? undefined;
  const image = detail?.imageUrl ?? cellar?.imageUrl ?? null;
  const communityRating = detail?.averageRating ?? cellar?.communityRating ?? null;
  const communityCount = detail?.ratingsCount ?? cellar?.communityCount ?? null;
  const payload = detail ? payloadFromDetail(detail) : payloadFromCellar(cellar!);
  const saved = cellar != null;
  const score = cellar?.score ?? null;
  const critics = (detail?.scores ?? []).filter((s) => s.score != null || s.scoreText);
  const pairings = pairingLabels(detail?.pairings);
  const prices = (detail?.prices ?? []).slice(0, 5);

  const specs = [
    { label: "Appellation", value: detail?.appellation },
    { label: "Classification", value: detail?.classification },
    { label: "Style", value: detail?.elaborate },
    { label: "Body", value: detail?.body },
    { label: "Acidity", value: detail?.acidity },
    { label: "Alcohol", value: detail?.alcoholContent != null ? `${detail.alcoholContent}% ABV` : null },
  ].filter((s): s is { label: string; value: string } => Boolean(s.value));

  const stats = [
    communityRating != null ? { label: "Community", value: formatScore(communityRating) } : null,
    communityCount ? { label: communityCount === 1 ? "Rating" : "Ratings", value: communityCount.toLocaleString("en") } : null,
    critics.length ? { label: critics.length === 1 ? "Critic review" : "Critic reviews", value: String(critics.length) } : null,
  ].filter((s): s is { label: string; value: string } => s != null);

  return (
    <>
      <TopBar active="cellar" />
      <main className="dc-page dc-page--detail" style={{ paddingTop: "var(--space-xl)" }}>
        <Link href={saved ? "/" : "/search"} className="dc-icon-button dc-icon-button--outline" aria-label={saved ? "Back to your cellar" : "Back to search"}>
          <Icon name="back" size={16} />
        </Link>

        <div className="dc-detail" style={{ marginTop: "var(--space-lg)" }}>
          <div>
            <div className="dc-detail__hero">
              <div className="dc-plate">{image ? <img src={image} alt={`Bottle of ${name}`} /> : <BottleSilhouette type={type} />}</div>
              <div className="dc-stack">
                <h1 className="t-display-lg">
                  {name}
                  {vintage && !name.includes(String(vintage)) ? ` ${vintage}` : ""}
                </h1>
                <div className="t-body-md t-muted">{[winery, region, country].filter(Boolean).join(" · ")}</div>
                <div className="t-body-sm" style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)" }}>
                  {type && <span className={`dc-dot dc-dot--${type}`} aria-hidden="true" />}
                  {[vintage ?? "NV", wineTypeLabel(type)].filter(Boolean).join(" · ")}
                </div>
                {cellar?.source === "manual" && <span className="dc-badge dc-badge--neutral" style={{ boxShadow: "inset 0 0 0 1px var(--hairline)" }}>Added by you</span>}
                {apiFailed && (
                  <p className="t-body-sm t-muted">We couldn't load the latest details from the wine catalogue, so this shows what's in your cellar.</p>
                )}
                {detail?.description && <p className="t-body-md">{detail.description}</p>}
              </div>
            </div>

            {cellar?.note && (
              <section className="dc-band" style={{ paddingBottom: 0 }} aria-labelledby="note-h">
                <h2 id="note-h" className="t-display-md">Your tasting note</h2>
                <blockquote className="t-body-md" style={{ margin: "var(--space-base) 0 0", padding: "var(--space-base) var(--space-lg)", background: "var(--primary-soft)", borderRadius: "var(--radius-md)", whiteSpace: "pre-wrap" }}>
                  {cellar.note}
                </blockquote>
              </section>
            )}

            {(specs.length > 0 || (detail?.grapes?.length ?? 0) > 0) && (
              <section className="dc-band" style={{ paddingBottom: 0 }} aria-labelledby="specs-h">
                <h2 id="specs-h" className="t-display-md" style={{ marginBottom: "var(--space-base)" }}>About this wine</h2>
                <dl className="dc-specs">
                  {specs.map((s) => (
                    <div key={s.label}>
                      <dt>{s.label}</dt>
                      <dd className="t-body-md">{s.value}</dd>
                    </div>
                  ))}
                  {detail?.grapes && detail.grapes.length > 0 && (
                    <div>
                      <dt>Grapes</dt>
                      <dd className="t-body-md">{detail.grapes.map((g) => g.name).join(", ")}</dd>
                    </div>
                  )}
                </dl>
              </section>
            )}

            {pairings.length > 0 && (
              <section className="dc-band" style={{ paddingBottom: 0 }} aria-labelledby="pair-h">
                <h2 id="pair-h" className="t-display-sm" style={{ marginBottom: "var(--space-base)" }}>Food pairings</h2>
                <div className="dc-chips">
                  {pairings.map((p) => (
                    <span key={p}>{p}</span>
                  ))}
                </div>
              </section>
            )}

            {critics.length > 0 && (
              <section className="dc-band" style={{ paddingBottom: 0 }} aria-labelledby="critics-h">
                <h2 id="critics-h" className="t-display-md" style={{ marginBottom: "var(--space-sm)" }}>Critic scores</h2>
                <ul className="dc-list">
                  {critics.map((c, i) => (
                    <li key={`${c.reviewer}-${i}`}>
                      <span className="t-body-md">
                        {c.reviewer?.trim() || "Critic score"}
                        {date(c.reviewDate) && <span className="t-body-sm t-muted"> · {date(c.reviewDate)}</span>}
                      </span>
                      <span className="t-title-md">{c.score != null ? c.score : c.scoreText}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="dc-detail__aside">
            <div className="dc-card">
              {score != null ? (
                <RatingDisplay value={score} label="Your rating" description={date(cellar?.ratedAt ?? null) ? `Rated ${date(cellar!.ratedAt)}` : undefined} stats={stats} />
              ) : communityRating != null ? (
                <RatingDisplay value={communityRating} label="Community rating" description="You haven't rated this wine yet." stats={stats.slice(1)} />
              ) : (
                <h2 className="t-display-md" style={{ marginBottom: "var(--space-sm)" }}>Rate this wine</h2>
              )}

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-xs)" }}>
                <span className="t-caption t-muted">{score != null ? "Change your rating" : "Tap a star to rate"}</span>
                <RatingInput value={score} action={rateAction} hidden={{ payload }} />
              </div>

              {score != null && (
                <form action={noteAction} className="dc-stack" style={{ marginTop: "var(--space-lg)" }}>
                  <input type="hidden" name="id" value={id} />
                  <label className="dc-field">
                    <span className="dc-field__label">Tasting note</span>
                    <textarea className="dc-input" name="note" defaultValue={cellar?.note ?? ""} placeholder="Dark cherry, violets and a long, dusty finish." maxLength={4000} />
                  </label>
                  <button type="submit" className="dc-button dc-button--primary dc-button--block">Save note</button>
                </form>
              )}

              <hr className="dc-divider" />

              {saved ? (
                <form action={removeAction}>
                  <input type="hidden" name="id" value={id} />
                  <button type="submit" className="dc-button dc-button--tertiary">Remove from cellar</button>
                </form>
              ) : (
                <form action={toggleSaveAction}>
                  <input type="hidden" name="payload" value={payload} />
                  <input type="hidden" name="saved" value="0" />
                  <button type="submit" className="dc-button dc-button--secondary dc-button--block">
                    <Icon name="heart" size={16} /> Save to cellar
                  </button>
                </form>
              )}

              {(detail?.priceRange || prices.length > 0) && (
                <>
                  <hr className="dc-divider" />
                  {detail?.priceRange && (
                    <div>
                      <div className="t-display-md">
                        {detail.priceRange.min === detail.priceRange.max
                          ? money(detail.priceRange.min, detail.priceRange.currency)
                          : `${money(detail.priceRange.min, detail.priceRange.currency)}–${money(detail.priceRange.max, detail.priceRange.currency)}`}
                      </div>
                      <div className="t-body-sm t-muted">bottle, where available</div>
                    </div>
                  )}
                  {prices.length > 0 && (
                    <ul className="dc-list t-body-sm" style={{ marginTop: "var(--space-sm)" }}>
                      {prices.map((p, i) => (
                        <li key={`${p.merchantName}-${i}`}>
                          {p.url ? (
                            <a href={p.url} rel="noopener noreferrer" target="_blank">{p.merchantName}</a>
                          ) : (
                            <span>{p.merchantName}</span>
                          )}
                          <span>{money(p.price, p.currency)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
