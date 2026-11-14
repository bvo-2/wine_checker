import Link from "next/link";
import { Icon } from "./Icon";
import { WINE_TYPES, type WineType } from "@/lib/types";

export function TopBar({ active }: { active: "cellar" | "search" | "add" }) {
  const tabs = [
    { id: "cellar", label: "My cellar", href: "/" },
    { id: "search", label: "Find wines", href: "/search" },
    { id: "add", label: "Add a wine", href: "/wines/new" },
  ] as const;
  return (
    <header className="dc-topbar">
      <div className="dc-page dc-topbar__inner">
        <Link href="/" className="dc-brand" aria-label="Decant home">
          <img className="dc-brand__tile" src="/decant-logo.png" alt="" width={40} height={40} />
          Decant
        </Link>
        <nav className="dc-tabs" aria-label="Main">
          {tabs.map((t) => (
            <Link key={t.id} href={t.href} aria-current={active === t.id ? "page" : undefined}>
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SearchBar({ q = "" }: { q?: string }) {
  return (
    <form action="/search" method="get" className="dc-search" role="search">
      <label className="dc-search__segment">
        <span className="dc-search__label">Wine</span>
        <input
          className="dc-search__input"
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Name, winery or appellation"
          aria-label="Search wines by name, winery or appellation"
          required
        />
      </label>
      <button type="submit" className="dc-search__orb" aria-label="Search">
        <Icon name="search" size={18} />
      </button>
    </form>
  );
}

/** Wine-type filter chips. One active at a time; pressing the active chip clears it. */
export function CategoryStrip({ active, hrefFor }: { active?: WineType; hrefFor: (t: WineType | null) => string }) {
  return (
    <nav className="dc-category-strip" aria-label="Filter by wine type">
      {WINE_TYPES.map((t) => {
        const on = active === t.id;
        return (
          <Link key={t.id} href={hrefFor(on ? null : t.id)} className="dc-chip" aria-pressed={on} scroll={false}>
            <span className={`dc-dot dc-dot--${t.id}`} aria-hidden="true" />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="dc-footer">
      <div className="dc-page dc-footer__row t-caption-sm">
        <span>© 2026 Decant · Drink responsibly. Enjoy wine only if you are of legal drinking age.</span>
        <span>
          Wine data from{" "}
          <a href="https://wineapi.io" style={{ color: "var(--link-legal)" }}>
            WineAPI
          </a>
        </span>
      </div>
    </footer>
  );
}
