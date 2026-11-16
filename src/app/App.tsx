import { Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { AddWinePage } from '../pages/AddWinePage';
import { CellarPage } from '../pages/CellarPage';
import { ComingSoonPage } from '../pages/ComingSoonPage';
import { EditWinePage } from '../pages/EditWinePage';
import { GroupListPage } from '../pages/GroupListPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { TastingsPage } from '../pages/TastingsPage';
import { TastingFormPage } from '../pages/TastingFormPage';
import { WineDetailPage } from '../pages/WineDetailPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<CellarPage />} />
        <Route path="wines/new" element={<AddWinePage />} />
        <Route path="wines/:wineId" element={<WineDetailPage />} />
        <Route path="wines/:wineId/edit" element={<EditWinePage />} />
        <Route path="wines/:wineId/tastings/new" element={<TastingFormPage />} />
        <Route path="wines/:wineId/tastings/:ratingId/edit" element={<TastingFormPage />} />
        <Route path="wineries" element={<GroupListPage field="producer" />} />
        <Route path="regions" element={<GroupListPage field="region" />} />
        <Route path="countries" element={<GroupListPage field="country" />} />
        <Route path="tastings" element={<TastingsPage />} />
        <Route path="backup" element={<ComingSoonPage title="Backup and restore" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
