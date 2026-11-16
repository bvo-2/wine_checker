import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePageTitle } from '../app/usePageTitle';
import { Button, ButtonLink } from '../components/Button/Button';
import { Icon } from '../components/Icon/Icon';
import { useRepositories } from '../data/RepositoriesContext';
import { findDuplicate } from '../domain/duplicates';
import { vintageLine } from '../domain/format';
import type { Wine } from '../domain/types';
import {
  EMPTY_WINE_FORM,
  emptyRatingForm,
  parseRatingForm,
  parseWineForm,
  type FieldErrors,
  type RatingFormValues,
  type WineFormValues,
} from '../domain/schemas';
import { FormAlert, SAVE_FAILED } from './forms/FormAlert';
import { focusFirstInvalid } from './forms/focus';
import formStyles from './forms/Forms.module.css';
import { RATING_MORE_FIELDS, RatingFields } from './forms/RatingFields';
import { WINE_MORE_FIELDS, WineFields } from './forms/WineFields';
import pageStyles from './Page.module.css';

/** Add a wine and rate it in one go. Only the name and the stars are required. */
export function AddWinePage() {
  usePageTitle('Add a wine');
  const repos = useRepositories();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [wine, setWine] = useState<WineFormValues>(EMPTY_WINE_FORM);
  const [rating, setRating] = useState<RatingFormValues>(emptyRatingForm);
  const [wineErrors, setWineErrors] = useState<FieldErrors<WineFormValues>>({});
  const [ratingErrors, setRatingErrors] = useState<FieldErrors<RatingFormValues>>({});
  const [attempt, setAttempt] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  /** The existing wine this entry looks like, once I have been asked about it. */
  const [duplicate, setDuplicate] = useState<Wine | null>(null);
  const duplicateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (duplicate) duplicateRef.current?.focus();
  }, [duplicate]);

  // After a failed submit, once the messages are on screen, go to the first one.
  useEffect(() => {
    if (attempt > 0) focusFirstInvalid(formRef.current);
  }, [attempt]);

  function changeWine(next: WineFormValues) {
    setWine(next);
    // The suggestion was about the old values; ask again if it still applies.
    setDuplicate(null);
  }

  /**
   * target "check": suggest an existing wine if this looks like a duplicate.
   * target "new": save as a new wine regardless. Otherwise: add the tasting to that wine.
   */
  async function save(target: 'check' | 'new' | Wine) {
    const parsedWine = parseWineForm(wine);
    const parsedRating = parseRatingForm(rating);
    setWineErrors(parsedWine.ok ? {} : parsedWine.errors);
    setRatingErrors(parsedRating.ok ? {} : parsedRating.errors);
    if (!parsedWine.ok || !parsedRating.ok) {
      // A message inside the closed "More details" section would be invisible: open it.
      const hidden =
        (!parsedWine.ok && WINE_MORE_FIELDS.some((f) => f in parsedWine.errors)) ||
        (!parsedRating.ok && RATING_MORE_FIELDS.some((f) => f in parsedRating.errors));
      if (hidden) setMoreOpen(true);
      setAttempt((n) => n + 1);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (target === 'check') {
        const match = findDuplicate(await repos.wines.list(), parsedWine.data);
        if (match) {
          setDuplicate(match);
          setSaving(false);
          return;
        }
      }
      if (typeof target === 'object') {
        await repos.ratings.create(target.id, parsedRating.data);
        navigate(`/wines/${target.id}`);
      } else {
        await repos.wines.createWithRating(parsedWine.data, parsedRating.data);
        navigate('/');
      }
    } catch (error) {
      console.error(error);
      setSaveError(SAVE_FAILED);
      setSaving(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void save(duplicate ? 'new' : 'check');
  }

  return (
    <form ref={formRef} className={formStyles.form} onSubmit={onSubmit} noValidate>
      <div>
        <Link to="/" className={pageStyles.back}>
          <Icon name="back" size={16} />
          My cellar
        </Link>
        <h1 className="t-display-xl">Add a wine</h1>
        <p className="t-body-md">Only the name and your rating are needed. The rest can wait.</p>
      </div>
      <section className={formStyles.section} aria-labelledby="wine-heading">
        <h2 id="wine-heading" className="t-display-md">
          The wine
        </h2>
        <WineFields values={wine} errors={wineErrors} onChange={changeWine} show="main" />
      </section>
      <section className={formStyles.section} aria-labelledby="rating-heading">
        <h2 id="rating-heading" className="t-display-md">
          Your tasting
        </h2>
        <RatingFields values={rating} errors={ratingErrors} onChange={setRating} show="main" />
      </section>
      <details
        className={formStyles.more}
        open={moreOpen}
        onToggle={(event) => setMoreOpen(event.currentTarget.open)}
      >
        <summary className={formStyles.summary}>More details</summary>
        <div className={formStyles.section}>
          <RatingFields values={rating} errors={ratingErrors} onChange={setRating} show="more" />
          <WineFields values={wine} errors={wineErrors} onChange={changeWine} show="more" />
        </div>
      </details>
      <FormAlert message={saveError} />
      {duplicate && (
        <div
          ref={duplicateRef}
          tabIndex={-1}
          role="group"
          aria-labelledby="duplicate-heading"
          className={formStyles.notice}
        >
          <h2 id="duplicate-heading" className="t-title-md">
            You already have this wine
          </h2>
          <p className="t-body-md">
            <Link to={`/wines/${duplicate.id}`}>{duplicate.name}</Link>
            {duplicate.producer ? ` by ${duplicate.producer}` : ''} ({vintageLine(duplicate)}) is in
            your cellar. Add this tasting to it, or save a separate wine.
          </p>
          <div className={formStyles.actions}>
            <Button onClick={() => void save(duplicate)} loading={saving}>
              Add tasting to existing wine
            </Button>
            <Button variant="secondary" onClick={() => void save('new')} disabled={saving}>
              Save as a new wine
            </Button>
          </div>
        </div>
      )}
      <div className={formStyles.actions}>
        {!duplicate && (
          <Button type="submit" loading={saving}>
            Save to my cellar
          </Button>
        )}
        <ButtonLink to="/" variant="secondary">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
