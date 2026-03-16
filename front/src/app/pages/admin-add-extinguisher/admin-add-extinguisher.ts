import { Component, AfterViewInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ExtinguisherService } from '../../services/extinguisher.service';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
  selector: 'app-admin-add-extinguisher',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './admin-add-extinguisher.html',
  styleUrl: './admin-add-extinguisher.css',
})
export class AdminAddExtinguisher implements AfterViewInit {
  private extinguisherService = inject(ExtinguisherService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  inspectionsOpen = true;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  formData = {
    type: 'Powder',
    capacity: '6',
    expiry_date: '',
    count: 1,
    price: 0
  };

  categories = ['Water', 'CO2', 'Powder', 'Foam'];

  toggleInspections() {
    this.inspectionsOpen = !this.inspectionsOpen;
    this.initIcons();
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

  saveUnit() {
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.extinguisherService.bulkCreate(this.formData).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message || `Successfully registered ${this.formData.count} extinguishers!`;
        // Reset count but keep type/capacity for quick entry
        this.formData.count = 1;
        this.cdr.detectChanges();
        this.initIcons();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to register extinguishers.';
        this.cdr.detectChanges();
      }
    });
  }
}
