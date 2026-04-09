import { Navigate, Route, Routes } from 'react-router-dom';
import { RoleRoute } from './guards/RoleRoute';
import { ProtectedRoute } from './guards/ProtectedRoute';
import { routes } from '../config/routes';
import { MainLayout } from '../layouts/MainLayout';
import { AuditPage } from '../pages/AuditPage';
import { DashboardPage } from '../pages/DashboardPage';
import { EventsPage } from '../pages/EventsPage';
import { ImportsPage } from '../pages/ImportsPage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ReportGeneratorPage } from '../pages/ReportGeneratorPage';
import { ReportsPage } from '../pages/ReportsPage';
import { ScenariosPage } from '../pages/ScenariosPage';
import { SettingsPage } from '../pages/SettingsPage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import { UsersPage } from '../pages/UsersPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path={routes.login} element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path={routes.dashboard} element={<DashboardPage />} />
          <Route path={routes.imports} element={<ImportsPage />} />
          <Route path={routes.events} element={<EventsPage />} />
          <Route path={routes.scenarios} element={<ScenariosPage />} />
          <Route path={routes.reportGenerator} element={<ReportGeneratorPage />} />
          <Route path={routes.reports} element={<ReportsPage />} />
          <Route path={routes.audit} element={<AuditPage />} />
          <Route path={routes.settings} element={<SettingsPage />} />

          <Route element={<RoleRoute role="validator" />}>
            <Route path={routes.users} element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path={routes.unauthorized} element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
      <Route path="" element={<Navigate to={routes.dashboard} replace />} />
    </Routes>
  );
}
