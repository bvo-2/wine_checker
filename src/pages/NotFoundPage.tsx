import { EmptyState } from '../components/EmptyState/EmptyState';
import { usePageTitle } from '../app/usePageTitle';

export function NotFoundPage() {
  usePageTitle('Page not found');
  return (
    <EmptyState
      level={1}
      title="Page not found"
      text="That page doesn't exist, or the wine it pointed to has been deleted."
      action={{ label: 'Back to my cellar', to: '/' }}
    />
  );
}
