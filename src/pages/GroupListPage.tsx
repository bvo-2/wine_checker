import { Link, useSearchParams } from 'react-router-dom';
import { usePageTitle } from '../app/usePageTitle';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { Icon } from '../components/Icon/Icon';
import { Select } from '../components/TextInput/TextInput';
import { useLive } from '../data/RepositoriesContext';
import { buildCellar } from '../domain/cellar';
import { formatScore, plural } from '../domain/format';
import { groupCellar, sortGroups, type GroupField, type WineGroup } from '../domain/grouping';
import cellarStyles from './Cellar.module.css';
import styles from './GroupList.module.css';
import { GROUP_PAGES } from './groups';
import { LiveStatus } from './LiveStatus';
import pageStyles from './Page.module.css';

function GroupRow({ field, group }: { field: GroupField; group: WineGroup }) {
  return (
    <Link to={`/?${field}=${encodeURIComponent(group.key)}`} className={styles.row}>
      <span className={styles.text}>
        <span className={styles.name}>{group.label}</span>
        <span className={styles.counts}>
          {plural(group.wineCount, 'wine')} · {plural(group.tastingCount, 'tasting')}
        </span>
      </span>
      {group.average === undefined ? (
        <span className={styles.unrated}>Not rated</span>
      ) : (
        <span className={styles.score}>
          <Icon name="star-filled" size={12} />
          <span className="sr-only">Average rating: </span>
          {formatScore(group.average)}
        </span>
      )}
    </Link>
  );
}

/** Wineries, Regions or Countries: my wines grouped by one field, built from my own data. */
export function GroupListPage({ field }: { field: GroupField }) {
  const page = GROUP_PAGES[field];
  usePageTitle(page.title);
  const [params, setParams] = useSearchParams();
  const sort = params.get('sort') === 'rating' ? 'rating' : 'name';
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
        title={`No ${page.title.toLowerCase()} yet`}
        text={page.emptyText}
        action={{ label: 'Add a wine', to: '/wines/new' }}
      />
    );
  }

  const groups = sortGroups(groupCellar(live.data, field), sort);
  return (
    <>
      <div className={pageStyles.head}>
        <h1 className="t-display-xl">{page.title}</h1>
        <p className={cellarStyles.count}>
          {plural(groups.length, page.one, page.title.toLowerCase())}
        </p>
      </div>
      <div className={cellarStyles.toolbar}>
        <div className={cellarStyles.sort}>
          <Select
            label="Sort by"
            value={sort}
            onChange={(event) =>
              setParams(event.target.value === 'rating' ? { sort: 'rating' } : {}, {
                replace: true,
              })
            }
          >
            <option value="name">Name (A to Z)</option>
            <option value="rating">Highest rated</option>
          </Select>
        </div>
      </div>
      <ul className={styles.list}>
        {groups.map((group) => (
          <li key={group.key}>
            <GroupRow field={field} group={group} />
          </li>
        ))}
      </ul>
    </>
  );
}
