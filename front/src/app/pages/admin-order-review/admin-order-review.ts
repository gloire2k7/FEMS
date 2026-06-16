import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-admin-order-review',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-order-review.html',
  styleUrl: './admin-order-review.css',
})
export class AdminOrderReview implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);

  orderId = 0;
  order: any = null;
  loading = true;
  error = '';

  grantMode: 'full' | 'partial' = 'full';
  grantQuantity = 1;
  deliveryDate = '';
  processing = false;
  actionError = '';
  actionSuccess = '';
  approvalResult: any = null;

  showDenyModal = false;
  denyReason = '';

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.orderId = +(params.get('id') || 0);
      if (!this.orderId) {
        this.error = 'Invalid order ID';
        this.loading = false;
        return;
      }
      this.loadOrder();
    });
  }

  ngAfterViewInit() {
    setTimeout(() => lucide?.createIcons?.(), 50);
  }

  loadOrder() {
    this.loading = true;
    this.error = '';
    this.orderService.getOrder(this.orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.grantQuantity = order.max_grantable || order.quantity;
        this.loading = false;
        setTimeout(() => lucide?.createIcons?.(), 50);
      },
      error: (err) => {
        this.error = err.error?.message || 'Could not load order';
        this.loading = false;
      },
    });
  }

  get canReview() {
    return this.order?.status === 'pending';
  }

  get stockMessage() {
    if (!this.order) return '';
    const avail = this.order.stock_available ?? 0;
    const qty = this.order.quantity ?? 0;
    if (avail >= qty) return `All ${qty} units are available in stock.`;
    if (avail === 0) return `No matching units in stock. Cannot grant this order yet.`;
    return `Only ${avail} of ${qty} units available in stock. You may grant partially or wait for more stock.`;
  }

  submitGrant() {
    if (!this.deliveryDate) {
      this.actionError = 'Please set an expected delivery date.';
      return;
    }

    const qty = this.grantMode === 'full'
      ? Math.min(this.order.quantity, this.order.max_grantable)
      : this.grantQuantity;

    if (qty < 1) {
      this.actionError = 'Grant quantity must be at least 1.';
      return;
    }
    if (qty > this.order.max_grantable) {
      this.actionError = `Only ${this.order.max_grantable} units can be granted from stock.`;
      return;
    }

    this.processing = true;
    this.actionError = '';
    this.orderService.grantOrder(this.orderId, {
      quantity: qty,
      expected_delivery_date: this.deliveryDate,
    }).subscribe({
      next: (res) => {
        this.processing = false;
        this.actionSuccess = res.message;
        this.approvalResult = res;
        this.loadOrder();
      },
      error: (err) => {
        this.processing = false;
        this.actionError = err.error?.message || 'Grant failed';
      },
    });
  }

  confirmDeny() {
    if (!this.denyReason.trim()) return;
    this.processing = true;
    this.orderService.denyOrder(this.orderId, this.denyReason.trim()).subscribe({
      next: () => {
        this.processing = false;
        this.showDenyModal = false;
        this.router.navigate(['/admin-orders']);
      },
      error: (err) => {
        this.processing = false;
        this.actionError = err.error?.message || 'Deny failed';
      },
    });
  }

  downloadLabels() {
    if (this.approvalResult?.labels_zip) {
      window.open(`http://localhost:8000${this.approvalResult.labels_zip}`, '_blank');
    }
  }
}
