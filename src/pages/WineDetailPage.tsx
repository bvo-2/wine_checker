import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePageTitle } from '../app/usePageTitle';
import { Button, ButtonLink } from '../components/Button/Button';
import { ConfirmDialog } from '../components/ConfirmDialog/ConfirmDialog';
import { Icon } from '../components/Icon/Icon';
import { RatingDisplay } from '../components/RatingDisplay/RatingDisplay';
import { ReviewCard } from '../components/ReviewCard/ReviewCard';
import { BottleSilhouette } from '../components/WineCard/BottleSilhouette';
import { useLive, useRepositories } from '../data/RepositoriesContext';
import { averageStars, byNewestTasting } from '../domain/cellar';
import { countryName } from '../domain/countries';
import { formatDate } from '../domain/dates';
import { originLine, plural, priceLine, vintageLine } from '../domain/format';
import { WINE_TYPE_LABELS, type Rating, type Wine } from '../domain/types';
import { LiveStatus } from './LiveStatus';
import { NotFoundPage } from './NotFoundPage';
import pageStyles from './Page.module.css';
import styles from './WineDetail.module.css';

/** Notes longer than about three lines get a "Show more" link. */
export function isLongNote(note: string | undefined): boolean {
  return !!note && (note.length > 180 || note.split('\n').length > 3);
}

function facts(wine: Wine): { label: string; value: string }[] {
  const list: [string, string | undefined][] = [
    ['Producer', wine.producer],
    ['Vintage', wine.vintage?.toString()],
    ['Type', wine.type && WINE_TYPE_LABELS[wine.type]],
    ['Region', wine.region],
    ['Country', wine.country && countryName(wine.country)],
    ['Grapes', wine.grapes?.join(', ')],
    ['Alcohol', wine.abv === undefined ? undefined : `${wine.abv} %`],
  ];
  return list.flatMap(([label, value]) => (value ? [{ label, value }] : []));
}

export function WineDetailPage() {
  const { wineId = '' } = useParams();
  const live = useLive(
    async (repos) => {
      const [wine, ratings] = await Promise.all([
        repos.wines.get(wineId),
        repos.ratings.listForWine(wineId),
      ]);
      return wine ? { wine, ratings: ratings.sort(byNewestTasting) } : null;
    },
    [wineId],
  );
  usePageTitle(live.status === 'ready' && live.data ? live.data.wine.name : 'Wine');

  if (live.status !== 'ready') return <LiveStatus live={live} />;
  if (!live.data) return <NotFoundPage />;
  return <WineDetail wine={live.data.wine} ratings={live.data.ratings} />;
}

function WineDetail({ wine, ratings }: { wine: Wine; ratings: Rating[] }) {
  const repos = useRepositories();
  const navigate = useNavigate();
  const [deletingWine, setDeletingWine] = useState(false);
  const [deletingRating, setDeletingRating] = useState<Rating | null>(null);
  const average = averageStars(ratings);
  const latest = ratings[0];
  const wineFacts = facts(wine);
  const origin = originLine(wine);

  return (
    <>
      <Link to="/" className={pageStyles.back}>
        <Icon name="back" size={16} />
        My cellar
      </Link>
      <div className={styles.hero}>
        <div className={styles.plate}>
          <BottleSilhouette type={wine.type} className={styles.silhouette} />
        </div>
        <div className={styles.heroText}>
          <h1 className="t-display-lg">{wine.name}</h1>
          {origin && <p className="t-body-md">{origin}</p>}
          <p className="t-body-sm t-muted">{vintageLine(wine)}</p>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>
          <section className={styles.section} aria-labelledby="tastings-heading">
            <div className={styles.sectionHead}>
              <h2 id="tastings-heading" className="t-display-md">
                My tastings
              </h2>
              <ButtonLink to={`/wines/${wine.id}/tastings/new`}>Add another tasting</ButtonLink>
            </div>
            {ratings.length === 0 ? (
              <p className="t-body-md">No tastings yet. Add one to rate this wine.</p>
            ) : (
              <ul className={styles.tastings}>
                {ratings.map((rating) => (
                  <li key={rating.id} className={styles.tasting}>
                    <ReviewCard
                      author={formatDate(rating.tastedOn)}
                      date={
                        [rating.place, priceLine(rating)].filter(Boolean).join(' · ') || undefined
                      }
                      rating={rating.stars}
                      expandable={isLongNote(rating.note)}
                      hideAvatar
                      actions={
                        <>
                          <ButtonLink
                            variant="tertiary"
                            to={`/wines/${wine.id}/tastings/${rating.id}/edit`}
                            aria-label={`Edit tasting of ${formatDate(rating.tastedOn)}`}
                          >
                            Edit
                          </ButtonLink>
                          <Button
                            variant="tertiary"
                            onClick={() => setDeletingRating(rating)}
                            aria-label={`Delete tasting of ${formatDate(rating.tastedOn)}`}
                          >
                            Delete
                          </Button>
                        </>
                      }
                    >
                      {rating.note}
                    </ReviewCard>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {wineFacts.length > 0 && (
            <section className={styles.section} aria-labelledby="facts-heading">
              <h2 id="facts-heading" className="t-display-md">
                About this wine
              </h2>
              <dl className={styles.facts}>
                {wineFacts.map((fact) => (
                  <div key={fact.label} className={styles.fact}>
                    <dt className={styles.factLabel}>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section className={styles.section} aria-labelledby="manage-heading">
            <h2 id="manage-heading" className="sr-only">
              Manage this wine
            </h2>
            <div className={styles.manage}>
              <ButtonLink variant="secondary" to={`/wines/${wine.id}/edit`}>
                Edit wine
              </ButtonLink>
              <Button variant="secondary" onClick={() => setDeletingWine(true)}>
                Delete wine
              </Button>
            </div>
          </section>
        </div>

        <aside className={styles.aside} aria-label="My rating">
          {average === undefined || !latest ? (
            <p className="t-body-md t-muted">Not rated yet</p>
          ) : (
            <RatingDisplay
              value={average}
              label={ratings.length === 1 ? 'My rating' : `Average of ${ratings.length} tastings`}
              stats={[
                {
                  label: ratings.length === 1 ? 'Tasting' : 'Tastings',
                  value: String(ratings.length),
                },
                { label: 'Best', value: String(Math.max(...ratings.map((r) => r.stars))) },
                { label: 'Last tasted', value: formatDate(latest.tastedOn, 'short') },
              ]}
            />
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={deletingWine}
        title="Delete this wine?"
        confirmLabel="Delete wine"
        onCancel={() => setDeletingWine(false)}
        onConfirm={async () => {
          await repos.wines.remove(wine.id);
          navigate('/');
        }}
      >
        <strong>{wine.name}</strong>
        {ratings.length > 0 ? ` and its ${plural(ratings.length, 'tasting')}` : ''} will be deleted
        for good. This cannot be undone.
      </ConfirmDialog>

      <ConfirmDialog
        open={deletingRating !== null}
        title="Delete this tasting?"
        confirmLabel="Delete tasting"
        onCancel={() => setDeletingRating(null)}
        onConfirm={async () => {
          if (deletingRating) await repos.ratings.remove(deletingRating.id);
          setDeletingRating(null);
        }}
      >
        Your tasting of {deletingRating ? formatDate(deletingRating.tastedOn) : ''} will be deleted
        for good. The wine stays in your cellar.
      </ConfirmDialog>
    </>
  );
}
