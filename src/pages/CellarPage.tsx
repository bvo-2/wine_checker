import { Link, useSearchParams } from 'react-router-dom';
import { usePageTitle } from '../app/usePageTitle';
import { Button } from '../components/Button/Button';
import { CategoryStrip } from '../components/CategoryStrip/CategoryStrip';
import { Icon } from '../components/Icon/Icon';
import { Select } from '../components/TextInput/TextInput';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { WineCard } from '../components/WineCard/WineCard';
import { useLive } from '../data/RepositoriesContext';
import {
  buildCellar,
  CELLAR_SORTS,
  filterCellar,
  sortCellar,
  type CellarEntry,
  type CellarSort,
} from '../domain/cellar';
import { GROUP_FIELDS, groupCellar, UNKNOWN_KEY } from '../domain/grouping';
import { WINE_TYPES, WINE_TYPE_LABELS } from '../domain/types';
import { GROUP_PAGES } from './groups';
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
            title={wine.name}
            producer={wine.producer}
            region={wine.region}
            vintage={wine.vintage}
            wine={wine.type}
            rating={latest?.stars}
            ratingLabel="Latest rating"
            badge={ratings.length > 1 ? plural(ratings.length, 'tasting') : undefined}
          />
        </li>
      ))}
    </ul>
  );
}

const SORT_LABELS: Record<CellarSort, string> = {
  recent: 'Most recent',
  rating: 'Highest rated',
  name: 'Name (A to Z)',
};

function isOneOf<T extends string>(list: readonly T[], value: string | null): value is T {
  return value !== null && (list as readonly string[]).includes(value);
}

/** The Wines tab: every wine I have tasted. Sort and filter live in the URL. */
export function CellarPage() {
  const [params, setParams] = useSearchParams();
  const typeParam = params.get('type');
  const sortParam = params.get('sort');
  const type = isOneOf(WINE_TYPES, typeParam) ? typeParam : undefined;
  const sort = isOneOf(CELLAR_SORTS, sortParam) ? sortParam : 'recent';
  // Set when arriving from the Wineries, Regions or Countries tab.
  const groupField = GROUP_FIELDS.find((field) => params.has(field));
  const group = groupField ? { field: groupField, key: params.get(groupField) ?? '' } : undefined;

  usePageTitle(group ? GROUP_PAGES[group.field].title : 'My cellar');

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

  function setParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  const inGroup = filterCellar(live.data, { group });
  const entries = sortCellar(filterCellar(inGroup, { type }), sort);
  const groupPage = group && GROUP_PAGES[group.field];
  const groupLabel =
    group && groupCellar(inGroup, group.field).find((g) => g.key === group.key)?.label;

  if (group && groupPage && inGroup.length === 0) {
    return (
      <EmptyState
        level={1}
        title={`No wines for this ${groupPage.one}`}
        text="It may have been renamed, or its wines deleted."
        action={{ label: `Back to ${groupPage.title.toLowerCase()}`, to: groupPage.path }}
      />
    );
  }

  return (
    <>
      {groupPage && (
        <Link to={groupPage.path} className={pageStyles.back}>
          <Icon name="back" size={16} />
          {groupPage.title}
        </Link>
      )}
      <div className={pageStyles.head}>
        <h1 className="t-display-xl">
          {group
            ? group.key === UNKNOWN_KEY
              ? `Unknown ${groupPage?.one}`
              : groupLabel
            : 'My cellar'}
        </h1>
        <p className={styles.count} role="status">
          {type
            ? `${entries.length} of ${plural(inGroup.length, 'wine')}`
            : plural(entries.length, 'wine')}
        </p>
      </div>
      <div className={styles.toolbar}>
        <CategoryStrip
          label="Filter by wine type"
          active={type ?? null}
          onChange={(id) => setParam('type', id ?? undefined)}
        />
        <div className={styles.sort}>
          <Select
            label="Sort by"
            value={sort}
            onChange={(event) =>
              setParam('sort', event.target.value === 'recent' ? undefined : event.target.value)
            }
          >
            {CELLAR_SORTS.map((id) => (
              <option key={id} value={id}>
                {SORT_LABELS[id]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {entries.length === 0 && type ? (
        <EmptyState
          title={`No ${WINE_TYPE_LABELS[type].toLowerCase()} wines yet`}
          text="Nothing in your cellar matches this filter."
        >
          <Button variant="secondary" onClick={() => setParam('type', undefined)}>
            Show all wines
          </Button>
        </EmptyState>
      ) : (
        <CellarGrid entries={entries} />
      )}
    </>
  );
}
