import { Link } from 'react-router-dom';
import { usePageTitle } from '../app/usePageTitle';
import { EmptyState } from '../components/EmptyState/EmptyState';
import { ReviewCard } from '../components/ReviewCard/ReviewCard';
import { useLive } from '../data/RepositoriesContext';
import { formatDate, formatMonth } from '../domain/dates';
import { plural, priceLine } from '../domain/format';
import { groupTastingsByMonth } from '../domain/grouping';
import cellarStyles from './Cellar.module.css';
import styles from './GroupList.module.css';
import { LiveStatus } from './LiveStatus';
import pageStyles from './Page.module.css';

/** Every tasting I have recorded, newest first, grouped by month. */
export function TastingsPage() {
  usePageTitle('Tastings');
  const live = useLive(async (repos) => {
    const [wines, ratings] = await Promise.all([repos.wines.list(), repos.ratings.list()]);
    return { months: groupTastingsByMonth(wines, ratings), count: ratings.length };
  }, []);
  if (live.status !== 'ready') return <LiveStatus live={live} />;

  if (live.data.count === 0) {
    return (
      <EmptyState
        level={1}
        title="No tastings yet"
        text="Each time you rate a wine, the tasting is listed here by date."
        action={{ label: 'Add a wine', to: '/wines/new' }}
      />
    );
  }

  return (
    <>
      <div className={pageStyles.head}>
        <h1 className="t-display-xl">Tastings</h1>
        <p className={cellarStyles.count}>{plural(live.data.count, 'tasting')}</p>
      </div>
      <div className={styles.months}>
        {live.data.months.map(({ month, tastings }) => (
          <section key={month} className={styles.month} aria-labelledby={`month-${month}`}>
            <h2 id={`month-${month}`} className="t-display-md">
              {formatMonth(month)}
            </h2>
            <ul className={styles.tastings}>
              {tastings.map(({ rating, wine }) => (
                <li key={rating.id}>
                  <ReviewCard
                    eyebrow={
                      wine ? (
                        <Link to={`/wines/${wine.id}`}>
                          {wine.name}
                          {wine.vintage ? ` ${wine.vintage}` : ''}
                        </Link>
                      ) : (
                        'Deleted wine'
                      )
                    }
                    title={formatDate(rating.tastedOn)}
                    stars={rating.stars}
                    note={rating.note}
                    meta={[rating.place, priceLine(rating)].filter((v): v is string => !!v)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
