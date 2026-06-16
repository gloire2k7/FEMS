import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-super-admin-admin-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './super-admin-admin-details.html',
  styleUrl: './super-admin-admin-details.css',
})
export class SuperAdminAdminDetails implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private router = inject(Router);

  adminId: number | null = null;
  admin: any = null;
  loading = true;
  error = '';
  saveMessage = '';
  saveError = '';

  editingPermissions = false;
  selectedPermissions: string[] = [];
  savingPermissions = false;

  confirmDelete = false;
  deleting = false;

  readonly permissionLabels: Record<string, string> = {
    manage_clients: 'Clients Management',
    manage_locations: 'Location Management',
    manage_inventory: 'Inventory Management',
    manage_orders: 'Orders Management',
    manage_inspections: 'Inspections Management',
    manage_refills: 'Refills Management',
    manage_notifications: 'Notifications',
    manage_settings: 'Settings',
    manage_ai_assistant: 'AI Assistant',
  };

  readonly editablePermissions = [
    { key: 'manage_clients',    label: 'Clients Management',    group: 'Operations' },
    { key: 'manage_locations',  label: 'Location Management',   group: 'Operations' },
    { key: 'manage_inventory',  label: 'Inventory Management',  group: 'Operations' },
    { key: 'manage_orders',     label: 'Orders Management',     group: 'Operations' },
    { key: 'manage_inspections',label: 'Inspections Management',group: 'Compliance' },
    { key: 'manage_refills',    label: 'Refills Management',    group: 'Compliance' },
  ];

  readonly systemPermissions = [
    { key: 'manage_notifications', label: 'Notifications' },
    { key: 'manage_settings',      label: 'Settings' },
    { key: 'manage_ai_assistant',  label: 'AI Assistant' },
  ];

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.adminId = id ? +id : null;
      if (!this.adminId) {
        this.loading = false;
        this.error = 'Invalid administrator ID.';
        return;
      }
      this.loadAdmin();
    });
  }

  loadAdmin() {
    this.loading = true;
    this.error = '';
    this.auth.getUserById(this.adminId!).subscribe({
      next: (user) => {
        this.admin = user;
        this.selectedPermissions = [...(user.permissions || [])];
        this.loading = false;
        this.refreshIcons();
      },
      error: () => {
        this.error = 'Could not load administrator.';
        this.loading = false;
      },
    });
  }

  permissionLabel(key: string): string {
    return this.permissionLabels[key] || key;
  }

  permissionsByGroup(group: string) {
    return this.editablePermissions.filter(p => p.group === group);
  }

  toggleStatus() {
    if (!this.admin) return;
    const next = this.admin.status === 'active' ? 'inactive' : 'active';
    this.auth.setAdminStatus(this.admin.id, next).subscribe({
      next: () => { this.admin.status = next; this.refreshIcons(); },
    });
  }

  startEditPermissions() {
    this.selectedPermissions = [...(this.admin.permissions || [])];
    this.editingPermissions = true;
    this.saveMessage = '';
    this.saveError = '';
  }

  cancelEditPermissions() {
    this.editingPermissions = false;
    this.selectedPermissions = [...(this.admin.permissions || [])];
  }

  togglePermission(key: string) {
    const i = this.selectedPermissions.indexOf(key);
    if (i >= 0) this.selectedPermissions.splice(i, 1);
    else this.selectedPermissions.push(key);
  }

  hasPermissionSelected(key: string): boolean {
    return this.selectedPermissions.includes(key);
  }

  savePermissions() {
    this.savingPermissions = true;
    this.saveMessage = '';
    this.saveError = '';
    this.auth.updateUser(this.adminId!, { permissions: this.selectedPermissions }).subscribe({
      next: (res) => {
        this.admin.permissions = res.permissions || [...this.selectedPermissions];
        this.selectedPermissions = [...this.admin.permissions];
        this.editingPermissions = false;
        this.savingPermissions = false;

        const added = (res.added || []).map((k: string) => this.permissionLabel(k));
        const removed = (res.removed || []).map((k: string) => this.permissionLabel(k));
        if (added.length || removed.length) {
          const parts: string[] = [];
          if (added.length) parts.push(`Granted: ${added.join(', ')}`);
          if (removed.length) parts.push(`Revoked: ${removed.join(', ')}`);
          this.saveMessage = `${parts.join('. ')}. An email was sent to ${this.admin.email}.`;
        } else {
          this.saveMessage = 'Permissions saved. No changes were detected.';
        }
        this.refreshIcons();
      },
      error: (err) => {
        this.savingPermissions = false;
        this.saveError = err.error?.message || 'Failed to save permissions.';
      },
    });
  }

  requestDelete() { this.confirmDelete = true; }
  cancelDelete()  { this.confirmDelete = false; }

  confirmDeleteAdmin() {
    this.deleting = true;
    this.auth.deleteUser(this.adminId!).subscribe({
      next: () => this.router.navigate(['/super-admin-admins']),
      error: () => { this.deleting = false; this.confirmDelete = false; },
    });
  }

  initials(name: string) {
    return (name || 'A').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  ngAfterViewInit() { this.refreshIcons(); }

  private refreshIcons() {
    setTimeout(() => lucide?.createIcons?.(), 0);
    setTimeout(() => lucide?.createIcons?.(), 120);
  }
}
