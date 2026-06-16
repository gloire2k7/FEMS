import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../services/stock.service';
import { ProductPriceService } from '../../services/product-price.service';
import { AuthService } from '../../auth.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-admin-inventory',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, FormsModule, PaginationComponent],
  templateUrl: './admin-inventory.html',
  styleUrl: './admin-inventory.css',
})
export class AdminInventoryComponent implements OnInit, AfterViewInit {
  private stock = inject(StockService);
  private priceService = inject(ProductPriceService);
  private auth = inject(AuthService);
  private router = inject(Router);

  summary: any = null;
  recent: any[] = [];
  recentPage = 1;
  recentLastPage = 1;
  recentTotal = 0;

  units: any[] = [];
  page = 1;
  lastPage = 1;
  total = 0;

  statusFilter: 'in_stock' | 'allocated' | 'all' = 'in_stock';
  typeFilter = '';
  sortOrder: 'newest' | 'oldest' = 'newest';
  typeOptions: string[] = [];

  loading = true;
  canManage = false;
  canDelete = false;

  editingUnit: any = null;
  editForm = { type: '', capacity: '', price: 0, status: 'filled', expiry_date: '' };
  savingEdit = false;
  deletingId: number | null = null;

  priceTypes: string[] = [];
  priceCapacities: string[] = [];
  priceRows: { type: string; capacity: string; price: number }[] = [];
  priceLoading = false;
  priceSaving = false;
  priceMessage = '';
  priceError = '';

  private unitsRequestId = 0;

  ngOnInit() {
    this.canManage = this.auth.isRole('Super Admin') || this.auth.hasPermission('manage_inventory');
    this.canDelete = this.canManage;
    this.loadRecent(1);
    this.loadUnits(1);
    if (this.canManage) {
      this.loadPrices();
    }
  }

  ngAfterViewInit() {
    this.initIcons();
  }

  loadRecent(page: number) {
    this.recentPage = page;
    this.stock.getSummary(page).subscribe({
      next: (res) => {
        this.summary = res.summary;
        const types = (res.summary?.by_type || []).map((r: { type: string }) => r.type);
        this.typeOptions = [...new Set<string>(types)].sort();
        const r = res.recent;
        this.recent = r.data || [];
        this.recentPage = r.page || 1;
        this.recentLastPage = r.last_page || 1;
        this.recentTotal = r.total || 0;
        this.initIcons();
      },
    });
  }

  loadUnits(page: number) {
    const requestId = ++this.unitsRequestId;
    this.page = page;
    this.loading = true;
    this.units = [];

    this.stock.getUnits(page, this.statusFilter, this.sortOrder, this.typeFilter).subscribe({
      next: (res) => {
        if (requestId !== this.unitsRequestId) return;
        this.units = res.data || [];
        this.page = res.page || 1;
        this.lastPage = res.last_page || 1;
        this.total = res.total || 0;
        this.loading = false;
        this.initIcons();
      },
      error: () => {
        if (requestId !== this.unitsRequestId) return;
        this.loading = false;
      },
    });
  }

  setFilter(filter: 'in_stock' | 'allocated' | 'all') {
    if (this.statusFilter === filter && !this.loading) {
      this.loadUnits(1);
      return;
    }
    this.statusFilter = filter;
    this.loadUnits(1);
  }

  setTypeFilter(type: string) {
    this.typeFilter = type;
    this.loadUnits(1);
  }

  setSort(sort: 'newest' | 'oldest') {
    this.sortOrder = sort;
    this.loadUnits(1);
  }

  goRegister() {
    this.router.navigate(['/admin-add-extinguisher']);
  }

  loadPrices() {
    this.priceLoading = true;
    this.priceError = '';
    this.priceService.getPrices().subscribe({
      next: (res) => {
        this.priceTypes = res.types || [];
        this.priceCapacities = res.capacities || [];
        this.priceRows = (res.prices || []).map((p: any) => ({
          type: p.type,
          capacity: p.capacity,
          price: +p.price,
        }));
        this.priceLoading = false;
        this.initIcons();
      },
      error: () => {
        this.priceLoading = false;
        this.priceError = 'Could not load pricing matrix.';
      },
    });
  }

  getPrice(type: string, capacity: string): number {
    const row = this.priceRows.find((r) => r.type === type && r.capacity === capacity);
    return row?.price ?? 0;
  }

  setPrice(type: string, capacity: string, value: number) {
    const row = this.priceRows.find((r) => r.type === type && r.capacity === capacity);
    if (row) {
      row.price = value;
    } else {
      this.priceRows.push({ type, capacity, price: value });
    }
  }

  savePrices() {
    this.priceSaving = true;
    this.priceMessage = '';
    this.priceError = '';
    this.priceService.updatePrices(this.priceRows).subscribe({
      next: () => {
        this.priceSaving = false;
        this.priceMessage = 'Pricing updated successfully.';
        this.initIcons();
      },
      error: (err) => {
        this.priceSaving = false;
        this.priceError = err.error?.message || 'Failed to save prices.';
      },
    });
  }

  openEdit(unit: any) {
    this.editingUnit = unit;
    this.editForm = {
      type: unit.type || '',
      capacity: unit.capacity || '',
      price: unit.price || 0,
      status: unit.status || 'filled',
      expiry_date: unit.expiry_date || '',
    };
  }

  cancelEdit() {
    this.editingUnit = null;
  }

  saveEdit() {
    if (!this.editingUnit) return;
    this.savingEdit = true;
    const payload = {
      ...this.editingUnit,
      type: this.editForm.type,
      capacity: this.editForm.capacity,
      price: this.editForm.price,
      status: this.editForm.status,
      expiry_date: this.editForm.expiry_date || null,
    };
    this.stock.updateUnit(this.editingUnit.id, payload).subscribe({
      next: () => {
        this.savingEdit = false;
        this.editingUnit = null;
        this.loadUnits(this.page);
        this.loadRecent(this.recentPage);
      },
      error: () => {
        this.savingEdit = false;
      },
    });
  }

  deleteUnit(unit: any) {
    if (!confirm(`Delete unit ${unit.serial_number}? This cannot be undone.`)) return;
    this.deletingId = unit.id;
    this.stock.deleteUnit(unit.id).subscribe({
      next: () => {
        this.deletingId = null;
        this.loadUnits(this.page);
        this.loadRecent(this.recentPage);
      },
      error: () => {
        this.deletingId = null;
      },
    });
  }

  qrUrl(path: string) {
    return path ? `http://localhost:8000${path}` : '';
  }

  private initIcons() {
    [0, 100, 300].forEach((d) => setTimeout(() => lucide?.createIcons?.(), d));
  }
}
