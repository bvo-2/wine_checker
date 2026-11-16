import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePageTitle } from '../app/usePageTitle';
import { Button, ButtonLink } from '../components/Button/Button';
import { Icon } from '../components/Icon/Icon';
import { useLive, useRepositories } from '../data/RepositoriesContext';
import {
  parseWineForm,
  wineToForm,
  type FieldErrors,
  type WineFormValues,
} from '../domain/schemas';
import type { Wine } from '../domain/types';
import { FormAlert, SAVE_FAILED } from './forms/FormAlert';
import { focusFirstInvalid } from './forms/focus';
import formStyles from './forms/Forms.module.css';
import { WineFields } from './forms/WineFields';
import { LiveStatus } from './LiveStatus';
import { NotFoundPage } from './NotFoundPage';
import pageStyles from './Page.module.css';

export function EditWinePage() {
  usePageTitle('Edit wine');
  const { wineId = '' } = useParams();
  const live = useLive((repos) => repos.wines.get(wineId).then((w) => w ?? null), [wineId]);
  if (live.status !== 'ready') return <LiveStatus live={live} />;
  if (!live.data) return <NotFoundPage />;
  // Keyed so the form starts from the stored wine once and then keeps my edits.
  return <EditWineForm key={live.data.id} wine={live.data} />;
}

function EditWineForm({ wine }: { wine: Wine }) {
  const repos = useRepositories();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<WineFormValues>(() => wineToForm(wine));
  const [errors, setErrors] = useState<FieldErrors<WineFormValues>>({});
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const back = `/wines/${wine.id}`;

  useEffect(() => {
    if (attempt > 0) focusFirstInvalid(formRef.current);
  }, [attempt]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseWineForm(values);
    setErrors(parsed.ok ? {} : parsed.errors);
    if (!parsed.ok) {
      setAttempt((n) => n + 1);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await repos.wines.update(wine.id, parsed.data);
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
        <h1 className="t-display-xl">Edit wine</h1>
      </div>
      <WineFields values={values} errors={errors} onChange={setValues} />
      <FormAlert message={saveError} />
      <div className={formStyles.actions}>
        <Button type="submit" loading={saving}>
          Save changes
        </Button>
        <ButtonLink to={back} variant="secondary">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
