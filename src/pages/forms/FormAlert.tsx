import { Icon } from '../../components/Icon/Icon';
import styles from './Forms.module.css';

/** An error that is not tied to one field, e.g. the browser refused to save. */
export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className={styles.alert}>
      <Icon name="alert" size={20} />
      {message}
    </p>
  );
}

export const SAVE_FAILED =
  'Could not save. Your browser refused to store the data; check that it has free space and is not in private mode, then try again.';
