import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, ButtonLink } from '../components/Button/Button';
import { useLive } from '../data/RepositoriesContext';
import { BACKUP_REMINDER_DAYS, isBackupDue } from '../domain/backup';
import styles from './AppShell.module.css';

const DISMISSED_KEY = 'decant.backupReminderDismissed';

function wasDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

/** A gentle nudge to export a backup when the last one is over 30 days old. */
export function BackupReminder() {
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState(wasDismissed);
  const live = useLive(async (repos) => {
    const [lastExportAt, wines] = await Promise.all([
      repos.meta.get('lastExportAt'),
      repos.wines.list(),
    ]);
    const oldest = wines.reduce<string | undefined>(
      (min, wine) => (min === undefined || wine.createdAt < min ? wine.createdAt : min),
      undefined,
    );
    return { lastExportAt, due: isBackupDue(lastExportAt, oldest) };
  }, []);

  if (dismissed || pathname === '/backup' || live.status !== 'ready' || !live.data.due) return null;

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Without sessionStorage the reminder simply comes back on the next visit.
    }
    setDismissed(true);
  }

  return (
    <aside className={styles.reminder} aria-label="Backup reminder">
      <p className="t-body-sm">
        {live.data.lastExportAt
          ? `Your last backup is more than ${BACKUP_REMINDER_DAYS} days old.`
          : 'You have not made a backup yet.'}{' '}
        Your cellar only lives on this device.
      </p>
      <div className={styles.reminderActions}>
        <ButtonLink to="/backup" variant="tertiary">
          Back up now
        </ButtonLink>
        <Button variant="tertiary" onClick={dismiss}>
          Not now
        </Button>
      </div>
    </aside>
  );
}
