import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './styles/global.css';
import { App } from './app/App';
import { registerServiceWorker, requestPersistentStorage } from './app/platform';
import { DecantDb } from './data/db';
import { RepositoriesProvider } from './data/RepositoriesContext';
import { createRepositories } from './data/repositories';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

const repositories = createRepositories(new DecantDb());

registerServiceWorker();
// Ask the browser not to evict the cellar when the device runs low on space.
void requestPersistentStorage();

createRoot(root).render(
  <StrictMode>
    <RepositoriesProvider repositories={repositories}>
      <HashRouter>
        <App />
      </HashRouter>
    </RepositoriesProvider>
  </StrictMode>,
);
