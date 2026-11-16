import { EmptyState } from '../components/EmptyState/EmptyState';
import { usePageTitle } from '../app/usePageTitle';

/** Placeholder for a section that a later phase builds. */
export function ComingSoonPage({ title }: { title: string }) {
  usePageTitle(title);
  return (
    <EmptyState
      level={1}
      title={title}
      text="Coming soon. This section is on its way."
      action={{ label: 'Back to my cellar', to: '/' }}
    />
  );
}
