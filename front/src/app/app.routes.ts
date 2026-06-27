import { Routes } from '@angular/router';
import { SignupComponent } from './pages/signup/signup';
import { SigninComponent } from './pages/signin/signin';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password';
import { ResetPasswordComponent } from './pages/reset-password/reset-password';
import { VerifyEmailComponent } from './pages/verify-email/verify-email';
import { ExtinguishersComponent } from './pages/extinguishers/extinguishers.component';
import { ServiceRequestsComponent } from './pages/service-requests/service-requests.component';
import { InspectorsOverviewComponent } from './pages/inspectors-overview/inspectors-overview.component';
import { LocationsDashboardComponent } from './pages/locations-dashboard/locations-dashboard.component';
import { LocationDetailsComponent } from './pages/location-details/location-details.component';
import { Reports } from './pages/reports/reports';
import { PlaceOrderComponent } from './pages/place-order/place-order';
import { AdminOrderReview } from './pages/admin-order-review/admin-order-review';

import { ViewExtinguisherComponent } from './pages/view-extinguisher/view-extinguisher.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
import { ClientsDashboard } from './pages/clients-dashboard/clients-dashboard';
import { AdminAddExtinguisher } from './pages/admin-add-extinguisher/admin-add-extinguisher';

import { AdminViewExtinguisherComponent } from './pages/admin-view-extinguisher/admin-view-extinguisher.component';
import { AdminInspectionLabel } from './pages/admin-inspection-label/admin-inspection-label';
import { AdminAssignedInspections } from './pages/admin-assigned-inspections/admin-assigned-inspections';
import { AdminMandatoryInspections } from './pages/admin-mandatory-inspections/admin-mandatory-inspections';
import { AdminInventoryComponent } from './pages/admin-inventory/admin-inventory';
import { AdminInspectors } from './pages/admin-inspectors/admin-inspectors';
import { AdminCompliance } from './pages/admin-compliance/admin-compliance';

import { AdminRefills } from './pages/admin-refills/admin-refills';
import { AdminSettings } from './pages/admin-settings/admin-settings';
import { AdminNotificationsComponent } from './pages/admin-notifications/admin-notifications';
import { AdminOrders } from './pages/admin-orders/admin-orders';
import { SuperAdminAddAdmin } from './pages/super-admin-add-admin/super-admin-add-admin';
import { SuperAdminAdmins } from './pages/super-admin-admins/super-admin-admins';
import { SuperAdminAdminDetails } from './pages/super-admin-admin-details/super-admin-admin-details';
import { SuperAdminClientDetails } from './pages/super-admin-client-details/super-admin-client-details';
import { SuperAdminClients } from './pages/super-admin-clients/super-admin-clients';
import { SuperAdminReports } from './pages/super-admin-reports/super-admin-reports';
import { SuperAdminLogs } from './pages/super-admin-logs/super-admin-logs';
import { ClientClientsComponent } from './pages/client-clients/client-clients';
import { MyOrdersComponent } from './pages/my-orders/my-orders';
import { InspectorInspectionsComponent } from './pages/inspector-inspections/inspector-inspections';
import { InspectorMyInspectionsComponent } from './pages/inspector-my-inspections/inspector-my-inspections';
import { InspectorReportsComponent } from './pages/inspector-reports/inspector-reports';
import { InspectorSettingsComponent } from './pages/inspector-settings/inspector-settings';
import { InspectorMandatoryInspectionsComponent } from './pages/inspector-mandatory-inspections/inspector-mandatory-inspections';
import { AiAssistantPageComponent } from './pages/ai-assistant-page/ai-assistant-page.component';

import { UnifiedShellComponent } from '../layout/shell/unified-shell.component';
import { UnifiedDashboardComponent } from './pages/unified-dashboard/unified-dashboard.component';
import { AccessControlComponent } from './pages/access-control/access-control.component';
import { authGuard, permissionGuard } from './core/access.guards';

export const routes: Routes = [
  // Public / auth pages (no shell)
  { path: '', component: SignupComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'signin', component: SigninComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'verify-email', component: VerifyEmailComponent },

  // Unified authenticated portal — one shell for every role, permission-driven.
  {
    path: '',
    component: UnifiedShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: UnifiedDashboardComponent, canActivate: [permissionGuard], data: { anyOf: ['dashboard.view'] } },

      // Legacy dashboards now resolve to the single adaptive dashboard.
      { path: 'super-admin-dashboard', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'admin-dashboard', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'inspector-dashboard', redirectTo: 'dashboard', pathMatch: 'full' },

      { path: 'assistant', component: AiAssistantPageComponent, canActivate: [permissionGuard], data: { anyOf: ['ai_assistant.use'] } },

      // Operations
      { path: 'clients', component: ClientsDashboard, canActivate: [permissionGuard], data: { anyOf: ['clients.view'] } },
      { path: 'admin-inventory', component: AdminInventoryComponent, canActivate: [permissionGuard], data: { anyOf: ['inventory.view'] } },
      { path: 'super-admin-inventory', component: AdminInventoryComponent, canActivate: [permissionGuard], data: { anyOf: ['inventory.view'] } },
      { path: 'admin-orders', component: AdminOrders, canActivate: [permissionGuard], data: { anyOf: ['orders.view'] } },
      { path: 'admin-orders/:id/review', component: AdminOrderReview, canActivate: [permissionGuard], data: { anyOf: ['orders.grant'] } },
      { path: 'admin-add-extinguisher', component: AdminAddExtinguisher, canActivate: [permissionGuard], data: { anyOf: ['inventory.create'] } },
      { path: 'admin-view-extinguisher/:id', component: AdminViewExtinguisherComponent, canActivate: [permissionGuard], data: { anyOf: ['inventory.view'] } },
      { path: 'admin-inspection-label/:id', component: AdminInspectionLabel, canActivate: [permissionGuard], data: { anyOf: ['inventory.view'] } },

      // Compliance / inspections (staff)
      { path: 'admin-assigned-inspections', component: AdminAssignedInspections, canActivate: [permissionGuard], data: { anyOf: ['inspections.view'] } },
      { path: 'admin-mandatory-inspections', component: AdminMandatoryInspections, canActivate: [permissionGuard], data: { anyOf: ['mandatory.manage'] } },
      { path: 'admin-compliance', component: AdminCompliance, canActivate: [permissionGuard], data: { anyOf: ['compliance.view'] } },
      { path: 'admin-inspectors', component: AdminInspectors, canActivate: [permissionGuard], data: { anyOf: ['inspectors.view'] } },
      { path: 'admin-refills', component: AdminRefills, canActivate: [permissionGuard], data: { anyOf: ['refills.view'] } },

      // Inspector work
      { path: 'inspector-inspections', component: InspectorInspectionsComponent, canActivate: [permissionGuard], data: { anyOf: ['inspections.complete'] } },
      { path: 'inspector-my-inspections', component: InspectorMyInspectionsComponent, canActivate: [permissionGuard], data: { anyOf: ['inspections.complete'] } },
      { path: 'inspector-mandatory-inspections', component: InspectorMandatoryInspectionsComponent, canActivate: [permissionGuard], data: { anyOf: ['inspections.complete'] } },

      // People & access
      { path: 'super-admin-admins', component: SuperAdminAdmins, canActivate: [permissionGuard], data: { anyOf: ['admins.view'] } },
      { path: 'super-admin-admin-details/:id', component: SuperAdminAdminDetails, canActivate: [permissionGuard], data: { anyOf: ['admins.view'] } },
      { path: 'super-admin-add-admin', component: SuperAdminAddAdmin, canActivate: [permissionGuard], data: { anyOf: ['admins.create'] } },
      { path: 'access-control', component: AccessControlComponent, canActivate: [permissionGuard], data: { anyOf: ['permissions.manage'] } },
      { path: 'super-admin-clients', component: SuperAdminClients, canActivate: [permissionGuard], data: { anyOf: ['clients.view'] } },
      { path: 'super-admin-client-details', component: SuperAdminClientDetails, canActivate: [permissionGuard], data: { anyOf: ['clients.view'] } },
      { path: 'client-clients', component: ClientClientsComponent, canActivate: [authGuard] },

      // Insights
      { path: 'super-admin-reports', component: SuperAdminReports, canActivate: [permissionGuard], data: { anyOf: ['reports.view'] } },
      { path: 'inspector-reports', component: InspectorReportsComponent, canActivate: [permissionGuard], data: { anyOf: ['reports.view'] } },
      { path: 'reports', component: Reports, canActivate: [permissionGuard], data: { anyOf: ['reports.view'] } },
      { path: 'super-admin-logs', component: SuperAdminLogs, canActivate: [permissionGuard], data: { anyOf: ['activity_logs.view'] } },

      // Client account pages
      { path: 'extinguishers', component: ExtinguishersComponent, canActivate: [permissionGuard], data: { anyOf: ['extinguishers.view'] } },
      { path: 'view-extinguisher/:id', component: ViewExtinguisherComponent, canActivate: [permissionGuard], data: { anyOf: ['extinguishers.view'] } },
      { path: 'locations', component: LocationsDashboardComponent, canActivate: [permissionGuard], data: { anyOf: ['locations.view'] } },
      { path: 'locations/:id', component: LocationDetailsComponent, canActivate: [permissionGuard], data: { anyOf: ['locations.view'] } },
      { path: 'place-order', component: PlaceOrderComponent, canActivate: [permissionGuard], data: { anyOf: ['orders.place'] } },
      { path: 'shop', redirectTo: 'place-order', pathMatch: 'full' },
      { path: 'cart', redirectTo: 'place-order', pathMatch: 'full' },
      { path: 'checkout', redirectTo: 'place-order', pathMatch: 'full' },
      { path: 'my-orders', component: MyOrdersComponent, canActivate: [permissionGuard], data: { anyOf: ['my_orders.view'] } },
      { path: 'service-requests', component: ServiceRequestsComponent, canActivate: [permissionGuard], data: { anyOf: ['service.request'] } },
      { path: 'inspectors', component: InspectorsOverviewComponent, canActivate: [authGuard] },

      // System (settings/notifications consolidate to the generic, role-agnostic pages)
      { path: 'settings', component: SettingsComponent, canActivate: [permissionGuard], data: { anyOf: ['settings.view'] } },
      { path: 'admin-settings', component: AdminSettings, canActivate: [permissionGuard], data: { anyOf: ['settings.view'] } },
      { path: 'inspector-settings', component: InspectorSettingsComponent, canActivate: [permissionGuard], data: { anyOf: ['settings.view'] } },
      { path: 'notifications', component: NotificationsComponent, canActivate: [permissionGuard], data: { anyOf: ['notifications.view'] } },
      { path: 'admin-notifications', component: AdminNotificationsComponent, canActivate: [permissionGuard], data: { anyOf: ['notifications.view'] } },
      { path: 'super-admin-notifications', component: AdminNotificationsComponent, canActivate: [permissionGuard], data: { anyOf: ['notifications.view'] } },
      { path: 'inspector-notifications', component: NotificationsComponent, canActivate: [permissionGuard], data: { anyOf: ['notifications.view'] } },
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];
