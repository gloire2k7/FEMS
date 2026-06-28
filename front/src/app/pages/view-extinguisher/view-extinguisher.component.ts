import { AfterViewInit, Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ExtinguisherService } from '../../services/extinguisher.service';
import { LocationService } from '../../services/location.service';

declare const lucide: { createIcons: () => void } | undefined;

const API_BASE = 'http://localhost:8000';

@Component({
  selector: 'app-view-extinguisher',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './view-extinguisher.component.html',
  styleUrls: ['./view-extinguisher.component.css', '../admin-view-extinguisher/admin-view-extinguisher.component.css']
})
export class ViewExtinguisherComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private extService = inject(ExtinguisherService);
  private locationService = inject(LocationService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  error = '';
  unit: any = null;
  unitId = '';
  locations: any[] = [];
  selectedLocationId: number | null = null;
  assigning = false;
  locationMessage = '';
  locationError = false;

  get statusLabel(): string {
    if (!this.unit) return '—';
    if (this.unit.expiry_date && new Date(this.unit.expiry_date) < new Date()) return 'Expired';
    const s = (this.unit.status || '').toLowerCase();
    if (s === 'maintenance' || s === 'under_maintenance') return 'In service';
    if (s === 'filled' || s === 'active' || s === 'passed') return 'Valid';
    return this.unit.status || 'Active';
  }

  get statusHint(): string {
    if (this.statusLabel === 'Expired') return 'Schedule replacement or refill';
    if (this.statusLabel === 'In service') return 'Currently being serviced';
    return 'In good standing';
  }

  getStatusClass(status: string) {
    switch (status?.toLowerCase()) {
      case 'filled':
      case 'passed': return 'status-passed';
      case 'expired':
      case 'condemned': return 'status-expired';
      default: return 'status-almost';
    }
  }

  getStatusColor(status: string) {
    switch (status?.toLowerCase()) {
      case 'filled':
      case 'passed': return '#059669';
      case 'expired':
      case 'condemned': return '#DC2626';
      default: return '#D97706';
    }
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.error = 'No extinguisher specified.';
        this.loading = false;
        return;
      }
      this.unitId = id;
      this.loadUnit(id);
      this.loadLocations();
    });
  }

  loadUnit(id: string) {
    this.loading = true;
    this.error = '';
    this.extService.getExtinguisher(id).subscribe({
      next: (data) => {
        this.unit = data;
        this.loading = false;
        this.cdr.detectChanges();
        this.refreshIcons();
      },
      error: () => {
        this.error = 'Could not load this extinguisher.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadLocations() {
    this.locationService.getLocations(1, 100).subscribe({
      next: (res) => {
        this.locations = res.data ?? [];
        this.cdr.detectChanges();
      }
    });
  }

  assignToLocation() {
    if (!this.selectedLocationId || !this.unitId) return;
    this.assigning = true;
    this.locationMessage = '';
    this.extService.assignLocation(this.unitId, this.selectedLocationId).subscribe({
      next: (res) => {
        this.unit = res.extinguisher ?? this.unit;
        this.locationMessage = 'Unit assigned to location.';
        this.locationError = false;
        this.selectedLocationId = null;
        this.assigning = false;
        this.loadUnit(this.unitId);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.locationMessage = err.error?.message || 'Failed to assign location.';
        this.locationError = true;
        this.assigning = false;
        this.cdr.detectChanges();
      }
    });
  }

  downloadLabel() {
    if (this.unit?.label_pdf_path) {
      window.open(`${API_BASE}${this.unit.label_pdf_path}`, '_blank');
    }
  }

  qrUrl(path: string) {
    return `${API_BASE}${path}`;
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  private refreshIcons() {
    setTimeout(() => lucide?.createIcons?.(), 50);
  }
}
