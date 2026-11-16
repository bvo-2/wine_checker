import { usePageTitle } from '../app/usePageTitle';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { WineCard } from '../components/WineCard/WineCard';
import { useLive } from '../data/RepositoriesContext';
import { buildCellar, sortCellar, type CellarEntry } from '../domain/cellar';
import { plural } from '../domain/format';
import styles from './Cellar.module.css';
import { LiveStatus } from './LiveStatus';
import pageStyles from './Page.module.css';

export function CellarGrid({ entries }: { entries: readonly CellarEntry[] }) {
  return (
    <ul className={styles.grid}>
      {entries.map(({ wine, ratings, latest }) => (
        <li key={wine.id}>
          <WineCard
            to={`/wines/${wine.id}`}
            name={wine.name}
            producer={wine.producer}
            region={wine.region}
            vintage={wine.vintage}
            type={wine.type}
            rating={latest?.stars}
            ratingLabel="Latest rating"
            badge={ratings.length > 1 ? plural(ratings.length, 'tasting') : undefined}
          />
        </li>
      ))}
    </ul>
  );
}

/** The Wines tab: every wine I have tasted, most recent first. */
export function CellarPage() {
  usePageTitle('My cellar');
  const live = useLive(
    async (repos) =>
      buildCellar(...(await Promise.all([repos.wines.list(), repos.ratings.list()]))),
    [],
  );
  if (live.status !== 'ready') return <LiveStatus live={live} />;

  if (live.data.length === 0) {
    return (
      <EmptyState
        level={1}
        title="Your cellar is empty"
        text="Add the wine you're drinking, give it a rating, and it will be kept here."
        action={{ label: 'Add your first wine', to: '/wines/new' }}
      />
    );
  }

  const entries = sortCellar(live.data, 'recent');
  return (
    <>
      <div className={pageStyles.head}>
        <h1 className="t-display-xl">My cellar</h1>
        <p className={styles.count}>{plural(entries.length, 'wine')}</p>
      </div>
      <CellarGrid entries={entries} />
    </>
  );
}
