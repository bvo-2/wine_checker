import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../app/App';
import { RepositoriesProvider } from '../data/RepositoriesContext';
import type { Repositories } from '../data/repositories';
import { createTestRepositories } from '../data/testing';

/** Renders the whole app at a path, on a fresh empty database unless one is given. */
export function renderApp(path = '/', repos: Repositories = createTestRepositories().repos) {
  const view = render(
    <RepositoriesProvider repositories={repos}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </RepositoriesProvider>,
  );
  return { ...view, repos };
}
