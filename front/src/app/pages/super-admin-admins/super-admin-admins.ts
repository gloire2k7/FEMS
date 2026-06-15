import { Component, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-super-admin-admins',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PaginationComponent],
  templateUrl: './super-admin-admins.html',
  styleUrl: './super-admin-admins.css',
})
export class SuperAdminAdmins implements AfterViewInit {
  private auth = inject(AuthService);
  admins: any[] = [];
  page = 1;
  lastPage = 1;
  total = 0;
  activeCount = 0;
  inactiveCount = 0;
  loading = true;

  ngAfterViewInit() { this.initIcons(); this.load(1); }

  load(page: number) {
    this.loading = true;
    this.page = page;
    this.auth.getAdmins(page).subscribe({
      next: (res) => {
        this.admins = res.data || [];
        this.page = res.page;
        this.lastPage = res.last_page;
        this.total = res.total;
        this.activeCount = this.admins.filter(a => a.status === 'active').length;
        this.inactiveCount = this.admins.filter(a => a.status === 'inactive').length;
        this.loading = false;
        setTimeout(() => this.initIcons(), 50);
      },
      error: () => { this.loading = false; }
    });
  }

  toggleStatus(admin: any) {
    const next = admin.status === 'active' ? 'inactive' : 'active';
    this.auth.setAdminStatus(admin.id, next).subscribe(() => this.load(this.page));
  }

  private initIcons() {
    lucide?.createIcons?.();
  }
}
