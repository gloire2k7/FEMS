import { Component, AfterViewInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';

declare const lucide: { createIcons: () => void } | undefined;

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
  permissionOptions: any[] = [];
  selectedPermissions: string[] = ['manage_orders', 'manage_stock', 'approve_clients'];
  isLoading = false;
  error = '';
  successData: any = null;

  ngAfterViewInit() {
    this.initIcons();
    this.authService.getPermissions().subscribe(p => this.permissionOptions = p);
  }

  togglePermission(key: string) {
    const i = this.selectedPermissions.indexOf(key);
    if (i >= 0) this.selectedPermissions.splice(i, 1);
    else this.selectedPermissions.push(key);
  }

  hasPermission(key: string) { return this.selectedPermissions.includes(key); }

  onCreateAdmin() {
    this.isLoading = true;
    this.error = '';
    this.successData = null;

    this.authService.createAdmin({
      name: this.name,
      email: this.email,
      permissions: this.selectedPermissions
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
