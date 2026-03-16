import { Component, AfterViewInit, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ExtinguisherService } from '../../services/extinguisher.service';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
  selector: 'app-admin-location-details',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './admin-location-details.html',
  styleUrl: './admin-location-details.css',
})
export class AdminLocationDetails implements OnInit, AfterViewInit {
  protected Math = Math;
  private extinguisherService = inject(ExtinguisherService);
  private cdr = inject(ChangeDetectorRef);

  inspectionsOpen = true;
  isLoading = false;
  searchExtinguisherQuery = '';
  stockFilter: 'all' | 'inStock' | 'withClient' = 'all';
  
  allExtinguishers: any[] = [];
  filteredExtinguishers: any[] = [];
  paginatedExtinguishers: any[] = [];
  
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  toggleInspections() {
    this.inspectionsOpen = !this.inspectionsOpen;
    this.initIcons();
  }

  ngOnInit() {
    this.loadExtinguishers();
  }

  loadExtinguishers() {
    this.isLoading = true;
    this.extinguisherService.getExtinguishers().subscribe({
      next: (data) => {
        this.allExtinguishers = data;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
        this.initIcons();
      },
      error: (err) => {
        console.error('Failed to load extinguishers', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter() {
    const query = this.searchExtinguisherQuery.toLowerCase();
    this.filteredExtinguishers = this.allExtinguishers.filter(ext => {
      const matchSearch = !query || ext.serial_number?.toLowerCase().includes(query) || ext.type?.toLowerCase().includes(query);
      const matchStock =
        this.stockFilter === 'all' ||
        (this.stockFilter === 'inStock' && !ext.client_id) ||
        (this.stockFilter === 'withClient' && !!ext.client_id);
      return matchSearch && matchStock;
    });
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExtinguishers.length / this.pageSize) || 1;
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedExtinguishers = this.filteredExtinguishers.slice(start, end);
    this.initIcons();
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  ngAfterViewInit() {
    this.initIcons();
  }

  private initIcons() {
    const run = () => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    };
    run();
    [100, 300, 600, 1000, 2000].forEach((delay) => {
      setTimeout(run, delay);
    });
  }

  getExtinguisherStatusClass(status: string) {
    switch (status?.toLowerCase()) {
      case 'filled':
      case 'passed':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'requires_refill':
      case 'requires_maintenance':
      case 'almost expired':
        return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'expired':
      case 'unfilled':
      case 'condemned':
        return 'bg-red-50 text-red-600 border-red-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  }

  getStatusIconColor(status: string) {
    switch (status?.toLowerCase()) {
      case 'filled':
      case 'passed': return 'bg-emerald-500';
      case 'requires_refill':
      case 'requires_maintenance':
      case 'almost expired': return 'bg-orange-500';
      case 'expired':
      case 'unfilled':
      case 'condemned': return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  }

  getNextInspectionClass(status: string) {
    switch (status?.toLowerCase()) {
      case 'almost expired':
      case 'requires_refill':
        return 'text-orange-600 font-black';
      case 'expired':
      case 'unfilled':
        return 'text-red-600 font-black';
      default:
        return 'text-slate-500 font-semibold';
    }
  }
}
