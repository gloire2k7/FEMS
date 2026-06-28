import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../auth.service';

declare const lucide: { createIcons: () => void } | undefined;

interface PermDef {
  key: string;
  label: string;
  description: string;
}
interface PermGroup {
  name: string;
  permissions: PermDef[];
}
interface DirUser {
  id: number;
  name: string;
  email: string;
  status: string;
  role_name: string;
  company_name?: string;
  permission_count: number;
}

@Component({
  selector: 'app-access-control',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './access-control.component.html',
})
export class AccessControlComponent implements OnInit, AfterViewInit {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  groups: PermGroup[] = [];
  roleDefaults: Record<string, string[]> = {};
  users: DirUser[] = [];

  search = '';
  roleFilter = 'all';
  loading = true;

  selectedUser: DirUser | null = null;
  loadingUser = false;
  selected = new Set<string>();
  private original = new Set<string>();
  collapsed = new Set<string>();

  saving = false;
  message = '';
  error = '';

  private currentUserId = 0;
  readonly SELF_LOCKED = 'permissions.manage';
  readonly roleOrder = ['Super Admin', 'Admin', 'Inspector', 'Company User'];

  ngOnInit() {
    this.currentUserId = this.auth.getUser()?.id ?? 0;
    forkJoin({
      catalog: this.auth.getPermissionCatalog(),
      directory: this.auth.getUserDirectory(),
    }).subscribe({
      next: ({ catalog, directory }) => {
        this.groups = catalog.groups || [];
        this.roleDefaults = catalog.role_defaults || {};
        this.users = directory || [];
        this.loading = false;

        const preselect = this.route.snapshot.queryParamMap.get('user');
        if (preselect) {
          const u = this.users.find((x) => x.id === +preselect);
          if (u) this.selectUser(u);
        }
        this.refreshIcons();
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load permissions. You may not have access.';
      },
    });
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  get filteredUsers(): DirUser[] {
    const q = this.search.trim().toLowerCase();
    return this.users.filter((u) => {
      if (this.roleFilter !== 'all' && u.role_name !== this.roleFilter) return false;
      if (!q) return true;
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.company_name || '').toLowerCase().includes(q)
      );
    });
  }

  get totalKeys(): number {
    return this.groups.reduce((n, g) => n + g.permissions.length, 0);
  }

  get isSuperAdmin(): boolean {
    return this.selectedUser?.role_name === 'Super Admin';
  }

  get editingSelf(): boolean {
    return !!this.selectedUser && this.selectedUser.id === this.currentUserId;
  }

  /** A permission the current user may not remove from themselves (anti-lockout). */
  isLocked(key: string): boolean {
    return this.editingSelf && key === this.SELF_LOCKED;
  }

  get dirty(): boolean {
    if (this.selected.size !== this.original.size) return true;
    for (const k of this.selected) if (!this.original.has(k)) return true;
    return false;
  }

  selectUser(u: DirUser) {
    this.selectedUser = u;
    this.message = '';
    this.error = '';
    this.loadingUser = true;
    this.selected = new Set();
    this.auth.getUserById(u.id).subscribe({
      next: (full) => {
        const perms: string[] = full.permissions || [];
        this.selected = new Set(perms);
        this.original = new Set(perms);
        this.loadingUser = false;
        this.refreshIcons();
      },
      error: () => {
        this.loadingUser = false;
        this.error = 'Could not load this user.';
      },
    });
  }

  toggle(key: string) {
    if (this.isLocked(key)) return;
    if (this.selected.has(key)) this.selected.delete(key);
    else this.selected.add(key);
  }

  isChecked(key: string): boolean {
    return this.selected.has(key);
  }

  groupChecked(g: PermGroup): number {
    return g.permissions.filter((p) => this.selected.has(p.key)).length;
  }
  groupAll(g: PermGroup): boolean {
    return g.permissions.length > 0 && this.groupChecked(g) === g.permissions.length;
  }
  toggleGroup(g: PermGroup) {
    const all = this.groupAll(g);
    for (const p of g.permissions) {
      if (all) this.selected.delete(p.key);
      else this.selected.add(p.key);
    }
    this.enforceLock();
  }

  /** Re-add any self-locked permission so a user can't strip their own access. */
  private enforceLock() {
    if (this.editingSelf) this.selected.add(this.SELF_LOCKED);
  }

  isCollapsed(name: string): boolean {
    return this.collapsed.has(name);
  }
  toggleCollapse(name: string) {
    if (this.collapsed.has(name)) this.collapsed.delete(name);
    else this.collapsed.add(name);
    this.refreshIcons();
  }

  selectAll() {
    this.groups.forEach((g) => g.permissions.forEach((p) => this.selected.add(p.key)));
  }
  clearAll() {
    this.selected.clear();
    this.enforceLock();
  }
  applyPreset(role: string) {
    const keys = this.roleDefaults[role] || [];
    this.selected = new Set(keys);
    this.enforceLock();
    this.message = `Loaded the ${role} template — review and save to apply.`;
    this.error = '';
  }

  get presetRoles(): string[] {
    return Object.keys(this.roleDefaults);
  }

  resetChanges() {
    this.selected = new Set(this.original);
    this.message = '';
    this.error = '';
  }

  save() {
    if (!this.selectedUser || this.saving) return;
    this.saving = true;
    this.message = '';
    this.error = '';
    const keys = Array.from(this.selected);
    this.auth.updateUser(this.selectedUser.id, { permissions: keys }).subscribe({
      next: (res) => {
        const perms: string[] = res.permissions || keys;
        this.selected = new Set(perms);
        this.original = new Set(perms);
        const added = (res.added || []).length;
        const removed = (res.removed || []).length;
        if (this.selectedUser) this.selectedUser.permission_count = perms.length;
        if (added || removed) {
          this.message = `Saved. Granted ${added}, revoked ${removed}. ${this.selectedUser?.email} was emailed.`;
        } else {
          this.message = 'Saved. No changes were detected.';
        }
        this.saving = false;
        // If you just edited your own access, refresh the session so the sidebar
        // and available features update immediately.
        if (this.editingSelf) {
          this.auth.refreshMe().subscribe({ error: () => {} });
        }
        this.refreshIcons();
      },
      error: (err) => {
        this.saving = false;
        this.error = err.error?.message || 'Failed to save permissions.';
      },
    });
  }

  roleBadge(role: string): string {
    const map: Record<string, string> = {
      'Super Admin': 'bg-violet-100 text-violet-700',
      Admin: 'bg-blue-100 text-blue-700',
      Inspector: 'bg-teal-100 text-teal-700',
      'Company User': 'bg-amber-100 text-amber-700',
    };
    return map[role] || 'bg-slate-100 text-slate-600';
  }

  initials(name: string): string {
    return (name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  }

  private refreshIcons() {
    setTimeout(() => lucide?.createIcons?.(), 0);
    setTimeout(() => lucide?.createIcons?.(), 120);
  }
}
