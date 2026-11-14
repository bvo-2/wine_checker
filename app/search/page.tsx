import Link from "next/link";
import type { Metadata } from "next";
import { Footer, SearchBar, TopBar } from "@/components/Chrome";
import { Icon } from "@/components/Icon";
import { WineCard } from "@/components/WineCard";
import { savedIds } from "@/lib/db";
import { payloadFromSummary } from "@/lib/payload";
import { toWineType } from "@/lib/types";
import { searchWines, WineApiError } from "@/lib/wineapi";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Find wines" };

const PAGE = 24;

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 200);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  let content: React.ReactNode;
  if (!q) {
    content = (
      <div className="dc-empty">
        <h2 className="t-display-sm">What did you drink?</h2>
        <p className="t-body-md">Try a name, a producer or an appellation — "Barolo", "Roulot", "Sancerre".</p>
      </div>
    );
  } else {
    try {
      const data = await searchWines(q, PAGE, (page - 1) * PAGE);
      const saved = savedIds(data.results.map((r) => r.id));
      const pages = Math.ceil(data.total / PAGE);
      content =
        data.results.length === 0 ? (
          <div className="dc-empty">
            <h2 className="t-display-sm">No wines match "{q}"</h2>
            <p className="t-body-md">Check the spelling, try the producer instead, or add it by hand.</p>
            <Link href="/wines/new" className="dc-button dc-button--secondary">Add a wine</Link>
          </div>
        ) : (
          <>
            <div className="dc-section-head">
              <h2 className="t-display-md">Results for "{q}"</h2>
              <span className="t-body-sm t-muted">{data.total.toLocaleString("en")} wines</span>
            </div>
            <div className="dc-grid">
              {data.results.map((r) => (
                <WineCard
                  key={r.id}
                  id={r.id}
                  title={r.name}
                  producer={r.winery}
                  region={[r.region, r.country].filter(Boolean).join(", ") || null}
                  vintage={r.vintage}
                  wine={toWineType(r.type)}
                  rating={r.averageRating ?? null}
                  ratingCount={r.ratingsCount ?? null}
                  ratingLabel="Community rating"
                  badge={saved.has(r.id) ? "In your cellar" : undefined}
                  saved={saved.has(r.id)}
                  savePayload={payloadFromSummary(r)}
                />
              ))}
            </div>
            {pages > 1 && (
              <nav className="dc-pager" aria-label="Pages">
                {page > 1 && (
                  <Link className="dc-button dc-button--secondary" href={`/search?${new URLSearchParams({ q, page: String(page - 1) })}`}>
                    Previous
                  </Link>
                )}
                <span className="t-body-sm t-muted" style={{ alignSelf: "center" }}>
                  Page {page} of {pages.toLocaleString("en")}
                </span>
                {page < pages && (
                  <Link className="dc-button dc-button--secondary" href={`/search?${new URLSearchParams({ q, page: String(page + 1) })}`}>
                    Next
                  </Link>
                )}
              </nav>
            )}
          </>
        );
    } catch (e) {
      const status = e instanceof WineApiError ? e.status : 0;
      content = (
        <div className="dc-alert" role="alert">
          <Icon name="alert" size={20} />
          <div className="t-body-md" style={{ color: "var(--error)" }}>
            {status === 401 || status === 403
              ? "We couldn't reach the wine catalogue: the WineAPI key is missing or invalid."
              : status === 429
                ? "The wine catalogue is busy. Try again in a minute."
                : "We couldn't reach the wine catalogue just now. Try again in a moment."}
          </div>
        </div>
      );
    }
  }

  return (
    <>
      <TopBar active="search" />
      <main>
        <section className="dc-page dc-band--tight" style={{ paddingTop: "var(--space-xxl)" }}>
          <SearchBar q={q} />
        </section>
        <section className="dc-page">{content}</section>
      </main>
      <Footer />
    </>
  );
}
