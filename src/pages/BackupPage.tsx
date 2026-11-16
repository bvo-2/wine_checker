import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { downloadTextFile, storageStatus, type StorageStatus } from '../app/platform';
import { usePageTitle } from '../app/usePageTitle';
import { Button } from '../components/Button/Button';
import { ConfirmDialog } from '../components/ConfirmDialog/ConfirmDialog';
import { Icon } from '../components/Icon/Icon';
import { useLive, useRepositories } from '../data/RepositoriesContext';
import {
  backupFileName,
  parseBackup,
  type BackupData,
  type ImportMode,
  type ImportPlan,
} from '../domain/backup';
import { plural } from '../domain/format';
import styles from './Backup.module.css';
import { FormAlert } from './forms/FormAlert';

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'long', timeStyle: 'short' }).format(date);
}

function counts(wines: number, ratings: number): string {
  return `${plural(wines, 'wine')} and ${plural(ratings, 'tasting')}`;
}

function describePlan(plan: ImportPlan, mode: ImportMode): string {
  if (mode === 'replace') {
    return `Replace will delete the ${counts(plan.removed.wines, plan.removed.ratings)} stored on this device and keep only the ${counts(plan.added.wines, plan.added.ratings)} from the file.`;
  }
  const changes = plan.wines.length + plan.ratings.length;
  if (changes === 0) return 'Merge will change nothing: everything in the file is already here.';
  return `Merge will add ${counts(plan.added.wines, plan.added.ratings)} and update ${counts(plan.updated.wines, plan.updated.ratings)} with newer copies from the file. Nothing is deleted.`;
}

const STORAGE_TEXT: Record<StorageStatus, string> = {
  persistent: 'The browser has agreed to keep your data on this device until you remove it.',
  'best-effort':
    'The browser may clear your data if the device runs low on space. Installing Decant to your home screen and exporting backups both help.',
  unknown: 'This browser does not say how long it will keep your data. Export backups regularly.',
};

export function BackupPage() {
  usePageTitle('Backup and restore');
  const repos = useRepositories();
  const fileRef = useRef<HTMLInputElement>(null);
  const lastExport = useLive((r) => r.meta.get('lastExportAt').then((v) => v ?? null), []);
  const [storage, setStorage] = useState<StorageStatus | null>(null);
  const [exported, setExported] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backup, setBackup] = useState<{ fileName: string; data: BackupData } | null>(null);
  const [mode, setMode] = useState<ImportMode>('merge');
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [imported, setImported] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void storageStatus().then((status) => active && setStorage(status));
    return () => {
      active = false;
    };
  }, []);

  // Keep the "what will happen" text in step with the chosen file and mode.
  useEffect(() => {
    let active = true;
    setPlan(null);
    if (backup) {
      void repos.backup.preview(backup.data, mode).then((next) => active && setPlan(next));
    }
    return () => {
      active = false;
    };
  }, [backup, mode, repos]);

  async function exportBackup() {
    setError(null);
    try {
      const data = await repos.backup.exportAll();
      const fileName = backupFileName();
      downloadTextFile(fileName, JSON.stringify(data, null, 2));
      await repos.meta.set('lastExportAt', data.exportedAt);
      setExported(`Saved ${fileName} with ${counts(data.wines.length, data.ratings.length)}.`);
    } catch (cause) {
      console.error(cause);
      setError('The backup could not be created. Nothing was changed.');
    }
  }

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setBackup(null);
    setImported(null);
    setError(null);
    if (!file) return;
    let text: string;
    try {
      text = await file.text();
    } catch {
      setError('The file could not be read. Nothing was changed.');
      return;
    }
    const result = parseBackup(text);
    if (!result.ok) {
      setError(`${result.message} Nothing was changed.`);
      event.target.value = '';
      return;
    }
    setMode('merge');
    setBackup({ fileName: file.name, data: result.data });
  }

  async function runImport() {
    if (!backup) return;
    try {
      const done = await repos.backup.importAll(backup.data, mode);
      setImported(
        mode === 'replace'
          ? `Import complete. Your cellar now holds the ${counts(done.added.wines, done.added.ratings)} from ${backup.fileName}.`
          : `Import complete. Added ${counts(done.added.wines, done.added.ratings)}; updated ${counts(done.updated.wines, done.updated.ratings)}.`,
      );
      setBackup(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (cause) {
      console.error(cause);
      setError('The import failed. Nothing was changed.');
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className={styles.page}>
      <div>
        <h1 className="t-display-xl">Backup and restore</h1>
        <p className="t-body-md">
          Your cellar is stored only in this browser, on this device. A backup file lets you restore
          it, or move it to another device.
        </p>
      </div>

      <section className={styles.section} aria-labelledby="export-heading">
        <h2 id="export-heading" className="t-display-md">
          Export
        </h2>
        <p className="t-body-md">
          {lastExport.status === 'ready' && lastExport.data
            ? `Last backup: ${formatDateTime(lastExport.data)}.`
            : 'No backup has been made on this device yet.'}
        </p>
        <Button onClick={() => void exportBackup()}>
          <Icon name="download" size={20} />
          Export backup
        </Button>
        {exported && (
          <p role="status" className={styles.success}>
            <Icon name="check" size={20} />
            {exported}
          </p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="import-heading">
        <h2 id="import-heading" className="t-display-md">
          Import
        </h2>
        <div className={styles.file}>
          <label htmlFor="backup-file" className={styles.fileLabel}>
            Backup file
          </label>
          <input
            ref={fileRef}
            id="backup-file"
            type="file"
            accept=".json,application/json"
            className={styles.fileInput}
            onChange={(event) => void chooseFile(event)}
          />
        </div>
        <FormAlert message={error} />
        {backup && (
          <div className={styles.summary}>
            <p className="t-body-md">
              <strong>{backup.fileName}</strong> was made on{' '}
              {formatDateTime(backup.data.exportedAt)} and holds{' '}
              <strong>{counts(backup.data.wines.length, backup.data.ratings.length)}</strong>.
            </p>
            <fieldset className={styles.modes}>
              <legend className="t-caption">How should it be imported?</legend>
              <label className={styles.mode}>
                <input
                  type="radio"
                  name="import-mode"
                  checked={mode === 'merge'}
                  onChange={() => setMode('merge')}
                />
                <span>
                  <strong>Merge</strong> with what is on this device. Nothing is deleted.
                </span>
              </label>
              <label className={styles.mode}>
                <input
                  type="radio"
                  name="import-mode"
                  checked={mode === 'replace'}
                  onChange={() => setMode('replace')}
                />
                <span>
                  <strong>Replace</strong> everything on this device with the file.
                </span>
              </label>
            </fieldset>
            <p className="t-body-sm" role="status">
              {plan ? describePlan(plan, mode) : 'Checking…'}
            </p>
            <Button onClick={() => setConfirming(true)} disabled={!plan}>
              <Icon name="upload" size={20} />
              Import
            </Button>
          </div>
        )}
        {imported && (
          <p role="status" className={styles.success}>
            <Icon name="check" size={20} />
            {imported}
          </p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="storage-heading">
        <h2 id="storage-heading" className="t-display-md">
          Storage on this device
        </h2>
        <p className="t-body-md">{storage ? STORAGE_TEXT[storage] : 'Checking…'}</p>
      </section>

      <ConfirmDialog
        open={confirming && plan !== null}
        title={mode === 'replace' ? 'Replace your cellar?' : 'Merge this backup?'}
        confirmLabel={mode === 'replace' ? 'Replace everything' : 'Merge'}
        destructive={mode === 'replace'}
        onCancel={() => setConfirming(false)}
        onConfirm={runImport}
      >
        {plan && describePlan(plan, mode)}
        {mode === 'replace' && ' This cannot be undone.'}
      </ConfirmDialog>
    </div>
  );
}
