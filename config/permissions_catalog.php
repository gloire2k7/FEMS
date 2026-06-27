<?php
/**
 * FEMS canonical permission catalog — single source of truth.
 *
 * Every feature and key action in the system is a permission, grouped so the
 * Super Admin can manage access easily. Keys use a `resource.action` convention.
 *
 * Consumed by:
 *   - database/migrate_v11.php (seeds the `permissions` table + maps legacy keys)
 *   - Permission model / UserController (grouped catalog API)
 *
 * NOTE: Super Admin implicitly has every permission and is never restricted.
 */

return [
    // ---------------------------------------------------------------------
    // Grouped permission definitions. Order here drives display order.
    // ---------------------------------------------------------------------
    'groups' => [
        'General' => [
            ['dashboard.view',      'View dashboard',            'See the main dashboard and its widgets'],
            ['notifications.view',  'View notifications',        'Access the notifications center'],
            ['settings.view',       'Access settings',           'View and edit own account settings'],
            ['ai_assistant.use',    'Use AI assistant',          'Access the FEMS AI assistant'],
        ],
        'Clients' => [
            ['clients.view',              'View clients',          'See the client list and client details'],
            ['clients.approve',           'Approve clients',       'Approve pending client registrations'],
            ['clients.reject',            'Reject clients',        'Reject pending client registrations'],
            ['clients.credentials.resend','Resend client credentials', 'Regenerate and email a client password'],
        ],
        'Inventory & Stock' => [
            ['inventory.view',   'View inventory',     'See stock and registered extinguishers'],
            ['inventory.create', 'Register units',     'Register new extinguishers / stock'],
            ['inventory.update', 'Edit units',         'Update extinguisher details'],
            ['inventory.delete', 'Remove units',       'Delete extinguishers from inventory'],
        ],
        'Pricing' => [
            ['pricing.view',   'View pricing',   'See product pricing'],
            ['pricing.update', 'Update pricing', 'Change product prices'],
        ],
        'Orders' => [
            ['orders.view',    'View & manage orders', 'See orders and their details'],
            ['orders.grant',   'Approve/deny orders',  'Approve or deny client orders'],
            ['orders.deliver', 'Deliver orders',       'Mark orders as delivered'],
        ],
        'Shop & My Orders' => [
            ['shop.view',         'Browse shop',        'Browse available products to order'],
            ['orders.place',      'Place orders',       'Submit new orders'],
            ['my_orders.view',    'View own orders',    'Track own placed orders'],
            ['extinguishers.view','View own units',     'View own extinguishers and locations'],
        ],
        'Locations' => [
            ['locations.view',   'View locations', 'See client locations and sites'],
            ['locations.manage', 'Manage locations', 'Create/edit locations and assign units'],
        ],
        'Inspections' => [
            ['inspections.view',     'View inspections',     'See inspection lists and details'],
            ['inspections.assign',   'Assign inspections',   'Assign inspections to inspectors'],
            ['inspections.complete', 'Complete inspections', 'Submit inspection results'],
            ['mandatory.manage',     'Manage mandatory inspections', 'Manage mandatory inspection types and assignments'],
            ['compliance.view',      'View compliance',      'See compliance alerts and status'],
        ],
        'Inspectors' => [
            ['inspectors.view',       'View inspectors',       'See the inspector list'],
            ['inspectors.create',     'Create inspectors',     'Add new inspectors'],
            ['inspectors.deactivate', 'Activate/deactivate inspectors', 'Toggle inspector account status'],
        ],
        'Refills & Service' => [
            ['service.request',  'Request service',  'Request refills or maintenance for own units'],
            ['refills.view',     'View service requests', 'See refill/maintenance requests'],
            ['refills.process',  'Process service requests', 'Schedule and complete service requests'],
        ],
        'Reports' => [
            ['reports.view',     'View reports',     'See generated reports'],
            ['reports.generate', 'Generate reports', 'Create new reports'],
            ['reports.export',   'Export reports',   'Download/export reports'],
        ],
        'Activity Logs' => [
            ['activity_logs.view',   'View activity logs',   'See the system activity log'],
            ['activity_logs.export', 'Export activity logs', 'Download the activity log'],
        ],
        'User & Access Management' => [
            ['admins.view',        'View users/admins',     'See admin and user accounts'],
            ['admins.create',      'Create admins',         'Create new admin accounts'],
            ['admins.deactivate',  'Activate/deactivate users', 'Toggle user account status'],
            ['admins.delete',      'Delete users',          'Permanently remove user accounts'],
            ['permissions.manage', 'Manage permissions',    'Grant or revoke permissions for any user'],
        ],
    ],

    // ---------------------------------------------------------------------
    // Legacy key -> new permission bundle. Used to migrate existing
    // user_permissions rows so nobody loses access.
    // ---------------------------------------------------------------------
    'legacy_map' => [
        'manage_clients'      => ['clients.view', 'clients.approve', 'clients.reject', 'clients.credentials.resend'],
        'approve_clients'     => ['clients.view', 'clients.approve', 'clients.reject'],
        'manage_inventory'    => ['inventory.view', 'inventory.create', 'inventory.update', 'inventory.delete', 'pricing.view', 'pricing.update'],
        'manage_stock'        => ['inventory.view', 'inventory.create'],
        'manage_orders'       => ['orders.view', 'orders.grant', 'orders.deliver'],
        'manage_inspections'  => ['inspections.view', 'inspections.assign', 'mandatory.manage', 'compliance.view'],
        'manage_inspectors'   => ['inspectors.view', 'inspectors.create', 'inspectors.deactivate'],
        'manage_refills'      => ['refills.view', 'refills.process'],
        'manage_locations'    => ['locations.view', 'locations.manage'],
        'manage_notifications'=> ['notifications.view'],
        'manage_settings'     => ['settings.view'],
        'manage_ai_assistant' => ['ai_assistant.use'],
    ],

    // ---------------------------------------------------------------------
    // Default permission bundle per role. Applied to existing users of that
    // role that have no explicit permissions yet, so their portal keeps
    // working once access becomes permission-driven. These are templates,
    // not hard limits — the Super Admin can add or remove any of them.
    // ---------------------------------------------------------------------
    'role_defaults' => [
        'Admin' => [
            'dashboard.view', 'notifications.view', 'settings.view', 'ai_assistant.use',
            'clients.view', 'clients.approve', 'clients.reject', 'clients.credentials.resend',
            'inventory.view', 'inventory.create', 'inventory.update', 'inventory.delete',
            'pricing.view', 'pricing.update',
            'orders.view', 'orders.grant', 'orders.deliver',
            'locations.view', 'locations.manage',
            'inspections.view', 'inspections.assign', 'mandatory.manage', 'compliance.view',
            'inspectors.view', 'inspectors.create', 'inspectors.deactivate',
            'refills.view', 'refills.process',
            'reports.view', 'reports.generate', 'reports.export',
        ],
        'Company User' => [
            'dashboard.view', 'notifications.view', 'settings.view', 'ai_assistant.use',
            'shop.view', 'orders.place', 'my_orders.view', 'extinguishers.view',
            'locations.view',
            'service.request',
            'reports.view', 'reports.generate', 'reports.export',
        ],
        'Inspector' => [
            'dashboard.view', 'notifications.view', 'settings.view',
            'inspections.view', 'inspections.complete',
            'reports.view', 'reports.generate', 'reports.export',
        ],
    ],
];
