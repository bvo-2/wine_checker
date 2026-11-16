import { useEffect } from 'react';

/** Sets the document title for the current screen. */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · Decant` : 'Decant';
  }, [title]);
}
