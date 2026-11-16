import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePageTitle } from '../app/usePageTitle';
import { Button, ButtonLink } from '../components/Button/Button';
import { Icon } from '../components/Icon/Icon';
import { useLive, useRepositories } from '../data/RepositoriesContext';
import {
  emptyRatingForm,
  parseRatingForm,
  ratingToForm,
  type FieldErrors,
  type RatingFormValues,
} from '../domain/schemas';
import type { Rating, Wine } from '../domain/types';
import { FormAlert, SAVE_FAILED } from './forms/FormAlert';
import { focusFirstInvalid } from './forms/focus';
import formStyles from './forms/Forms.module.css';
import { RatingFields } from './forms/RatingFields';
import { LiveStatus } from './LiveStatus';
import { NotFoundPage } from './NotFoundPage';
import pageStyles from './Page.module.css';

/** Add another tasting to a wine, or edit one. The route decides which. */
export function TastingFormPage() {
  const { wineId = '', ratingId } = useParams();
  usePageTitle(ratingId ? 'Edit tasting' : 'Add a tasting');
  const live = useLive(
    async (repos) => {
      const [wine, rating] = await Promise.all([
        repos.wines.get(wineId),
        ratingId ? repos.ratings.get(ratingId) : undefined,
      ]);
      if (!wine) return null;
      if (ratingId && (!rating || rating.wineId !== wine.id)) return null;
      return { wine, rating };
    },
    [wineId, ratingId],
  );
  if (live.status !== 'ready') return <LiveStatus live={live} />;
  if (!live.data) return <NotFoundPage />;
  return (
    <TastingForm
      key={live.data.rating?.id ?? 'new'}
      wine={live.data.wine}
      rating={live.data.rating}
    />
  );
}

function TastingForm({ wine, rating }: { wine: Wine; rating?: Rating }) {
  const repos = useRepositories();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<RatingFormValues>(() =>
    rating ? ratingToForm(rating) : emptyRatingForm(),
  );
  const [errors, setErrors] = useState<FieldErrors<RatingFormValues>>({});
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const back = `/wines/${wine.id}`;

  useEffect(() => {
    if (attempt > 0) focusFirstInvalid(formRef.current);
  }, [attempt]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseRatingForm(values);
    setErrors(parsed.ok ? {} : parsed.errors);
    if (!parsed.ok) {
      setAttempt((n) => n + 1);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      if (rating) await repos.ratings.update(rating.id, parsed.data);
      else await repos.ratings.create(wine.id, parsed.data);
      navigate(back);
    } catch (error) {
      console.error(error);
      setSaveError(SAVE_FAILED);
      setSaving(false);
    }
  }

  return (
    <form ref={formRef} className={formStyles.form} onSubmit={onSubmit} noValidate>
      <div>
        <Link to={back} className={pageStyles.back}>
          <Icon name="back" size={16} />
          {wine.name}
        </Link>
        <h1 className="t-display-xl">{rating ? 'Edit tasting' : 'Add a tasting'}</h1>
        <p className="t-body-md">{wine.name}</p>
      </div>
      <RatingFields values={values} errors={errors} onChange={setValues} />
      <FormAlert message={saveError} />
      <div className={formStyles.actions}>
        <Button type="submit" loading={saving}>
          {rating ? 'Save changes' : 'Save tasting'}
        </Button>
        <ButtonLink to={back} variant="secondary">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
