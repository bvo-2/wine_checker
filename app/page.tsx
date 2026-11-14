import Link from "next/link";
import { CategoryStrip, Footer, SearchBar, TopBar } from "@/components/Chrome";
import { WineCard } from "@/components/WineCard";
import { cellarStats, listCellar, type CellarSort } from "@/lib/db";
import { payloadFromCellar } from "@/lib/payload";
import { formatScore, toWineType, wineTypeLabel, type WineType } from "@/lib/types";

export const dynamic = "force-dynamic";

const SORTS: { id: CellarSort; label: string }[] = [
  { id: "recent", label: "Recent" },
  { id: "rating", label: "Your rating" },
  { id: "name", label: "Name" },
];

export default async function CellarPage({ searchParams }: { searchParams: Promise<{ type?: string; sort?: string }> }) {
  const sp = await searchParams;
  const type = toWineType(sp.type);
  const sort: CellarSort = SORTS.some((s) => s.id === sp.sort) ? (sp.sort as CellarSort) : "recent";
  const wines = listCellar({ type, sort });
  const stats = cellarStats();

  const href = (next: { type?: WineType | null; sort?: CellarSort }) => {
    const p = new URLSearchParams();
    const t = next.type === undefined ? type : next.type;
    const s = next.sort ?? sort;
    if (t) p.set("type", t);
    if (s !== "recent") p.set("sort", s);
    const qs = p.toString();
    return qs ? `/?${qs}` : "/";
  };

  return (
    <>
      <TopBar active="cellar" />
      <main>
        <section className="dc-page dc-band" style={{ textAlign: "center" }}>
          <h1 className="t-display-xl">Wines worth opening again</h1>
          <p className="t-body-md t-muted" style={{ margin: "var(--space-sm) 0 var(--space-xl)" }}>
            {stats.total === 0
              ? "Find a bottle, rate it, and it lands here."
              : `${stats.total} in your cellar · ${stats.rated} rated${stats.average != null ? ` · ${formatScore(stats.average)} average` : ""}`}
          </p>
          <SearchBar />
        </section>

        <section className="dc-page" aria-labelledby="cellar-heading">
          <div className="dc-section-head">
            <h2 id="cellar-heading" className="t-display-md">
              {type ? `${wineTypeLabel(type)} wines` : "Your cellar"}
            </h2>
            <nav className="dc-chips" aria-label="Sort">
              {SORTS.map((s) => (
                <Link
                  key={s.id}
                  href={href({ sort: s.id })}
                  className="dc-chip"
                  aria-pressed={sort === s.id}
                  scroll={false}
                >
                  {s.label}
                </Link>
              ))}
            </nav>
          </div>
          <div style={{ marginBottom: "var(--space-lg)" }}>
            <CategoryStrip active={type} hrefFor={(t) => href({ type: t })} />
          </div>

          {wines.length === 0 ? (
            <div className="dc-empty">
              <h3 className="t-display-sm">{type ? `No ${wineTypeLabel(type)?.toLowerCase()} wines yet` : "Your cellar is empty"}</h3>
              <p className="t-body-md">Search for a bottle you've tried, or add one by hand.</p>
              <div style={{ display: "flex", gap: "var(--space-base)", justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/search" className="dc-button dc-button--primary">Find a wine</Link>
                <Link href="/wines/new" className="dc-button dc-button--secondary">Add a wine</Link>
              </div>
            </div>
          ) : (
            <div className="dc-grid">
              {wines.map((w) => (
                <WineCard
                  key={w.id}
                  id={w.id}
                  title={w.name}
                  producer={w.winery}
                  region={w.region}
                  vintage={w.vintage}
                  wine={w.type}
                  image={w.imageUrl}
                  rating={w.score}
                  ratingLabel="Your rating"
                  badge={w.score == null ? "Not rated" : w.score === 5 ? "Loved it" : undefined}
                  badgeTone={w.score === 5 ? "primary" : "neutral"}
                  saved
                  savePayload={payloadFromCellar(w)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
