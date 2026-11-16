import type { Live } from '../data/RepositoriesContext';
import { EmptyState } from '../components/EmptyState/EmptyState';

/** Shared loading and error rendering for pages that read stored data. */
export function LiveStatus({ live }: { live: Live<unknown> }) {
  if (live.status === 'loading') {
    return (
      <p className="t-body-md t-muted" role="status">
        Loading…
      </p>
    );
  }
  if (live.status === 'error') {
    return (
      <EmptyState
        level={1}
        title="Your data could not be read"
        text="The browser's storage is not available. If you are in a private window, open Decant in a normal one."
      />
    );
  }
  return null;
}
