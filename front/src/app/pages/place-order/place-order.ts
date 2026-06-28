import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProductPriceService } from '../../services/product-price.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../auth.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-place-order',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './place-order.html',
  styleUrl: './place-order.css',
})
export class PlaceOrderComponent implements OnInit {
  private priceService = inject(ProductPriceService);
  private orderService = inject(OrderService);
  private auth = inject(AuthService);
  private router = inject(Router);

  categories = ['Water', 'CO2', 'Powder', 'Foam'];
  capacities = ['6', '9', '12'];
  paymentMethods = ['Bank transfer', 'Mobile money', 'Invoice', 'Cash on delivery'];

  form = {
    type: 'Powder',
    capacity: '6',
    quantity: 1,
    delivery_address: '',
    payment_method: 'Bank transfer',
    notes: '',
  };

  unitPrice = 0;
  totalPrice = 0;
  priceLoading = false;
  priceError = '';
  submitting = false;
  submitError = '';
  submitSuccess = '';

  ngOnInit() {
    const user = this.auth.getUser();
    if (user?.address) {
      this.form.delivery_address = user.address;
    }
    this.refreshPrice();
    setTimeout(() => lucide?.createIcons?.(), 50);
  }

  onProductChange() {
    this.refreshPrice();
  }

  refreshPrice() {
    this.priceLoading = true;
    this.priceError = '';
    this.priceService.lookup(this.form.type, this.form.capacity).subscribe({
      next: (res) => {
        this.unitPrice = res.unit_price;
        this.totalPrice = this.unitPrice * Math.max(1, this.form.quantity);
        this.priceLoading = false;
      },
      error: (err) => {
        this.unitPrice = 0;
        this.totalPrice = 0;
        this.priceError = err.error?.message || 'Price unavailable';
        this.priceLoading = false;
      },
    });
  }

  onQuantityChange() {
    this.form.quantity = Math.max(1, this.form.quantity || 1);
    this.totalPrice = this.unitPrice * this.form.quantity;
  }

  submit() {
    if (!this.form.delivery_address.trim()) {
      this.submitError = 'Delivery address is required.';
      return;
    }
    if (this.unitPrice <= 0) {
      this.submitError = 'Cannot place order — price not available for this product.';
      return;
    }

    this.submitting = true;
    this.submitError = '';
    this.submitSuccess = '';

    this.orderService.placeOrder({
      type: this.form.type,
      capacity: this.form.capacity,
      quantity: this.form.quantity,
      delivery_address: this.form.delivery_address.trim(),
      payment_method: this.form.payment_method,
      notes: this.form.notes.trim() || undefined,
    }).subscribe({
      next: (res) => {
        this.submitting = false;
        this.submitSuccess = res.message || 'Order submitted successfully.';
        setTimeout(() => this.router.navigate(['/my-orders']), 1500);
      },
      error: (err) => {
        this.submitting = false;
        this.submitError = err.error?.message || 'Failed to submit order.';
      },
    });
  }
}
