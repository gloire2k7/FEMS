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

  editingPermissions = false;
  selectedPermissions: string[] = [];
  savingPermissions = false;

  confirmDelete = false;
  deleting = false;

  readonly editablePermissions = [
    { key: 'manage_clients',    label: 'Clients Management',    group: 'Operations' },
    { key: 'manage_locations',  label: 'Location Management',   group: 'Operations' },
    { key: 'manage_inventory',  label: 'Inventory Management',  group: 'Operations' },
    { key: 'manage_orders',     label: 'Orders Management',     group: 'Operations' },
    { key: 'manage_inspections',label: 'Inspections Management',group: 'Compliance' },
    { key: 'manage_refills',    label: 'Refills Management',    group: 'Compliance' },
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.adminId = id ? +id : null;
    if (!this.adminId) { this.loading = false; return; }
    this.loadAdmin();
  }

  loadAdmin() {
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
  }

  cancelEditPermissions() {
    this.editingPermissions = false;
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
    this.auth.updateUser(this.adminId!, { permissions: this.selectedPermissions }).subscribe({
      next: () => {
        this.admin.permissions = [...this.selectedPermissions];
        this.editingPermissions = false;
        this.savingPermissions = false;
        this.refreshIcons();
      },
      error: () => { this.savingPermissions = false; },
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
