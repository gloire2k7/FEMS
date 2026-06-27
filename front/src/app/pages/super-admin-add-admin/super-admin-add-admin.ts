import { Component, AfterViewInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';

declare const lucide: { createIcons: () => void } | undefined;

interface PermDef { key: string; label: string; description: string; }
interface PermGroup { name: string; permissions: PermDef[]; }

@Component({
  selector: 'app-super-admin-add-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './super-admin-add-admin.html',
  styleUrl: './super-admin-add-admin.css',
})
export class SuperAdminAddAdmin implements AfterViewInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  name = '';
  email = '';
  /** Permission groups shown in the picker (the always-granted "General" group is hidden). */
  groups: PermGroup[] = [];
  selected = new Set<string>();
  isLoading = false;
  error = '';
  successData: any = null;

  ngAfterViewInit() {
    this.initIcons();
    this.authService.getPermissionCatalog().subscribe((cat) => {
      this.groups = (cat.groups || []).filter((g) => g.name !== 'General');
      const adminDefaults = cat.role_defaults?.['Admin'] || [];
      const general = new Set((cat.groups || []).find((g) => g.name === 'General')?.permissions.map((p) => p.key) || []);
      this.selected = new Set(adminDefaults.filter((k) => !general.has(k)));
      setTimeout(() => this.initIcons(), 50);
    });
  }

  togglePermission(key: string) {
    if (this.selected.has(key)) this.selected.delete(key);
    else this.selected.add(key);
  }

  hasPermission(key: string) { return this.selected.has(key); }

  groupAll(g: PermGroup): boolean {
    return g.permissions.length > 0 && g.permissions.every((p) => this.selected.has(p.key));
  }
  toggleGroup(g: PermGroup) {
    const all = this.groupAll(g);
    for (const p of g.permissions) {
      if (all) this.selected.delete(p.key);
      else this.selected.add(p.key);
    }
  }

  onCreateAdmin() {
    this.isLoading = true;
    this.error = '';
    this.successData = null;

    this.authService.createAdmin({
      name: this.name,
      email: this.email,
      permissions: Array.from(this.selected),
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successData = { email: this.email, password: res.generated_password, emailed: true };
        this.name = '';
        this.email = '';
        this.cdr.detectChanges();
        setTimeout(() => this.initIcons(), 100);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Failed to create admin.';
        this.cdr.detectChanges();
      }
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => alert('Copied!'));
  }

  private initIcons() { lucide?.createIcons?.(); }
}
