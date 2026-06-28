import { Component, AfterViewInit, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ExtinguisherService } from '../../services/extinguisher.service';
import { ProductPriceService } from '../../services/product-price.service';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
  selector: 'app-admin-add-extinguisher',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, FormsModule],
  templateUrl: './admin-add-extinguisher.html',
  styleUrl: './admin-add-extinguisher.css',
})
export class AdminAddExtinguisher implements OnInit, AfterViewInit {
  private extinguisherService = inject(ExtinguisherService);
  private priceService = inject(ProductPriceService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  isLoading = false;
  successMessage = '';
  errorMessage = '';

  formData = {
    type: 'Powder',
    capacity: '6',
    expiry_date: '',
    count: 1,
  };

  categories = ['Water', 'CO2', 'Powder', 'Foam'];
  capacities = ['6', '9', '12'];
  unitPrice = 0;
  totalPrice = 0;
  priceError = '';

  ngOnInit() {
    this.refreshPrice();
  }

  ngAfterViewInit() {
    this.initIcons();
  }

  onProductChange() {
    this.refreshPrice();
  }

  onCountChange() {
    this.formData.count = Math.max(1, Math.min(100, this.formData.count || 1));
    this.totalPrice = this.unitPrice * this.formData.count;
  }

  refreshPrice() {
    this.priceService.lookup(this.formData.type, this.formData.capacity).subscribe({
      next: (res) => {
        this.unitPrice = res.unit_price;
        this.totalPrice = this.unitPrice * this.formData.count;
        this.priceError = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.unitPrice = 0;
        this.totalPrice = 0;
        this.priceError = err.error?.message || 'Price not configured';
        this.cdr.detectChanges();
      },
    });
  }

  saveUnit() {
    if (!this.formData.expiry_date) {
      this.errorMessage = 'Expiry date is required.';
      return;
    }
    if (this.unitPrice <= 0) {
      this.errorMessage = 'Set a price for this type and capacity in inventory pricing first.';
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.extinguisherService.bulkCreate(this.formData).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage =
          res.message ||
          `Successfully registered ${this.formData.count} extinguishers at ${this.unitPrice.toLocaleString()} RWF each!`;
        this.formData.count = 1;
        this.onCountChange();
        this.cdr.detectChanges();
        this.initIcons();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to register extinguishers.';
        this.cdr.detectChanges();
      },
    });
  }

  private initIcons() {
    const run = () => lucide?.createIcons?.();
    run();
    [100, 300].forEach((d) => setTimeout(run, d));
  }
}
