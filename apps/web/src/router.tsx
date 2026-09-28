import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router';
import { AppLayout } from './components/Shell';
import { LoginPage } from './routes/LoginPage';
import { DashboardPage } from './routes/DashboardPage';
import { InventoryPage } from './routes/InventoryPage';
import { POWizardPage } from './routes/POWizardPage';
import { ApprovalsPage } from './routes/ApprovalsPage';

const rootRoute = createRootRoute({ component: () => <Outlet /> });

const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: LoginPage });

const appRoute = createRoute({ getParentRoute: () => rootRoute, id: 'app', component: AppLayout });

const dashboardRoute = createRoute({ getParentRoute: () => appRoute, path: '/', component: DashboardPage });
const inventoryRoute = createRoute({ getParentRoute: () => appRoute, path: '/inventory', component: InventoryPage });
const poNewRoute = createRoute({ getParentRoute: () => appRoute, path: '/purchase-orders/new', component: POWizardPage });
const approvalsRoute = createRoute({ getParentRoute: () => appRoute, path: '/approvals', component: ApprovalsPage });

const routeTree = rootRoute.addChildren([
  loginRoute,
  appRoute.addChildren([dashboardRoute, inventoryRoute, poNewRoute, approvalsRoute])
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
