import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
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

  adminId: number | null = null;
  admin: any = null;
  loading = true;
  error = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.adminId = id ? +id : null;
    if (!this.adminId) {
      this.loading = false;
      return;
    }
    this.auth.getUserById(this.adminId).subscribe({
      next: (user) => {
        this.admin = user;
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
      next: () => {
        this.admin.status = next;
        this.refreshIcons();
      },
    });
  }

  initials(name: string) {
    return (name || 'A').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  private refreshIcons() {
    setTimeout(() => lucide?.createIcons?.(), 0);
    setTimeout(() => lucide?.createIcons?.(), 120);
  }
}
