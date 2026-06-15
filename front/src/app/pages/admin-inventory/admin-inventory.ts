import { Component, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../services/stock.service';
import { AuthService } from '../../auth.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive, FormsModule, PaginationComponent],
  templateUrl: './admin-inventory.html',
  styleUrl: './admin-inventory.css',
})
export class AdminInventoryComponent implements AfterViewInit {
  private stock = inject(StockService);
  private auth = inject(AuthService);
  private router = inject(Router);

  inspectionsOpen = false;
  summary: any = null;
  recent: any[] = [];
  units: any[] = [];
  page = 1;
  lastPage = 1;
  total = 0;
  loading = true;
  canManage = false;

  ngAfterViewInit() {
    this.canManage = this.auth.isRole('Super Admin') || this.auth.hasPermission('manage_stock');
    this.load();
    this.initIcons();
  }

  load(page = 1) {
    this.page = page;
    this.loading = true;
    this.stock.getSummary().subscribe({
      next: (res) => {
        this.summary = res.summary;
        this.recent = res.recent || [];
      }
    });
    this.stock.getUnits(page, true).subscribe({
      next: (res) => {
        this.units = res.data || [];
        this.page = res.page || 1;
        this.lastPage = res.last_page || 1;
        this.total = res.total || 0;
        this.loading = false;
        setTimeout(() => this.initIcons(), 50);
      },
      error: () => { this.loading = false; }
    });
  }

  goRegister() {
    this.router.navigate(['/admin-add-extinguisher']);
  }

  toggleInspections() {
    this.inspectionsOpen = !this.inspectionsOpen;
    this.initIcons();
  }

  qrUrl(path: string) {
    return path ? `http://localhost:8000${path}` : '';
  }

  private initIcons() {
    [0, 100, 300].forEach(d => setTimeout(() => lucide?.createIcons?.(), d));
  }
}
