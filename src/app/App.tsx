import { Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { ComingSoonPage } from '../pages/ComingSoonPage';
import { NotFoundPage } from '../pages/NotFoundPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<ComingSoonPage title="My cellar" />} />
        <Route path="wines/new" element={<ComingSoonPage title="Add a wine" />} />
        <Route path="wineries" element={<ComingSoonPage title="Wineries" />} />
        <Route path="regions" element={<ComingSoonPage title="Regions" />} />
        <Route path="countries" element={<ComingSoonPage title="Countries" />} />
        <Route path="tastings" element={<ComingSoonPage title="Tastings" />} />
        <Route path="backup" element={<ComingSoonPage title="Backup and restore" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
