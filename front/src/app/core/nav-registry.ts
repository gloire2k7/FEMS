/**
 * Single source of truth for the unified portal navigation.
 *
 * Every authenticated user shares ONE portal. The sidebar simply renders the
 * items the user has permission for (`anyOf`). Super Admin sees everything.
 *
 * Route paths are intentionally kept identical to the historical role-specific
 * routes so nothing breaks — only the shell/navigation is unified.
 */

export type BadgeKey = 'orders' | 'clients' | 'notifications';

export interface NavItem {
  label: string;
  icon: string;
  /** Existing route path. Use the '__reports__' sentinel for the audience-resolved reports route. */
  route: string;
  /** Visible if the user has ANY of these permissions. Empty/omitted => always visible. */
  anyOf?: string[];
  badge?: BadgeKey;
  exact?: boolean;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const REPORTS_ROUTE_SENTINEL = '__reports__';

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard', icon: 'layout-dashboard', route: '/dashboard', anyOf: ['dashboard.view'], exact: true },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Clients', icon: 'users', route: '/clients', anyOf: ['clients.view'], badge: 'clients' },
      { label: 'Inventory', icon: 'package', route: '/admin-inventory', anyOf: ['inventory.view'] },
      { label: 'Orders', icon: 'shopping-bag', route: '/admin-orders', anyOf: ['orders.view'], badge: 'orders' },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { label: 'Inspection requests', icon: 'clipboard-check', route: '/admin-assigned-inspections', anyOf: ['inspections.view'] },
      { label: 'Mandatory inspections', icon: 'calendar-check', route: '/admin-mandatory-inspections', anyOf: ['mandatory.manage'] },
      { label: 'Compliance', icon: 'shield-check', route: '/admin-compliance', anyOf: ['compliance.view'] },
      { label: 'Inspectors', icon: 'user-check', route: '/admin-inspectors', anyOf: ['inspectors.view'] },
      { label: 'Refills', icon: 'repeat', route: '/admin-refills', anyOf: ['refills.view'] },
    ],
  },
  {
    label: 'Inspection work',
    items: [
      { label: 'Inspection pool', icon: 'search', route: '/inspector-inspections', anyOf: ['inspections.complete'] },
      { label: 'My inspections', icon: 'list-checks', route: '/inspector-my-inspections', anyOf: ['inspections.complete'] },
      { label: 'My mandatory', icon: 'calendar-check', route: '/inspector-mandatory-inspections', anyOf: ['inspections.complete'] },
    ],
  },
  {
    label: 'My account',
    items: [
      { label: 'My extinguishers', icon: 'flame', route: '/extinguishers', anyOf: ['extinguishers.view'] },
      { label: 'My locations', icon: 'map-pin', route: '/locations', anyOf: ['locations.view'] },
      { label: 'Place order', icon: 'clipboard-list', route: '/place-order', anyOf: ['orders.place'] },
      { label: 'My orders', icon: 'package', route: '/my-orders', anyOf: ['my_orders.view'] },
      { label: 'Service requests', icon: 'wrench', route: '/service-requests', anyOf: ['service.request'] },
    ],
  },
  {
    label: 'People & access',
    items: [
      { label: 'Admins', icon: 'shield', route: '/super-admin-admins', anyOf: ['admins.view'] },
      { label: 'Add admin', icon: 'user-plus', route: '/super-admin-add-admin', anyOf: ['admins.create'] },
      { label: 'Access control', icon: 'key-round', route: '/access-control', anyOf: ['permissions.manage'] },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Reports', icon: 'file-text', route: REPORTS_ROUTE_SENTINEL, anyOf: ['reports.view'] },
      { label: 'Activity logs', icon: 'scroll-text', route: '/super-admin-logs', anyOf: ['activity_logs.view'] },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Notifications', icon: 'bell', route: '/notifications', anyOf: ['notifications.view'], badge: 'notifications' },
      { label: 'Settings', icon: 'settings', route: '/settings', anyOf: ['settings.view'] },
      { label: 'AI Assistant', icon: 'sparkles', route: '/assistant', anyOf: ['ai_assistant.use'] },
    ],
  },
];
