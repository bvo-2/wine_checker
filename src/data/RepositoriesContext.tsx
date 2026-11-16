import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Repositories } from './repositories';

const Context = createContext<Repositories | null>(null);

export function RepositoriesProvider({
  repositories,
  children,
}: {
  repositories: Repositories;
  children: ReactNode;
}) {
  return <Context.Provider value={repositories}>{children}</Context.Provider>;
}

export function useRepositories(): Repositories {
  const value = useContext(Context);
  if (!value) throw new Error('useRepositories must be used inside RepositoriesProvider');
  return value;
}

export type Live<T> =
  { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error'; error: unknown };

/**
 * Reads data and keeps it fresh: the query runs again whenever the stored data it
 * read changes, in this tab or another one.
 */
export function useLive<T>(
  query: (repos: Repositories) => Promise<T>,
  deps: readonly unknown[],
): Live<T> {
  const repos = useRepositories();
  const [state, setState] = useState<Live<T>>({ status: 'loading' });
  const queryRef = useRef(query);
  queryRef.current = query;

  useEffect(() => {
    setState({ status: 'loading' });
    return repos.watch(
      () => queryRef.current(repos),
      (data) => setState({ status: 'ready', data }),
      (error) => setState({ status: 'error', error }),
    );
    // The caller lists what the query depends on, as with useEffect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repos, ...deps]);

  return state;
}
