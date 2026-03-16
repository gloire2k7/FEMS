import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  private router = inject(Router);
  private orderService = inject(OrderService);

  cartItems: any[] = [];
  paymentMethod = 'momo';

  user: any = null;
  
  deliveryForm = {
    company_name: '',
    full_name: '',
    phone: '',
    email: '',
    delivery_address: '',
    city: '',
    notes: ''
  };

  isPlacingOrder = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit() {
    const stored = sessionStorage.getItem('fems_cart');
    this.cartItems = stored ? JSON.parse(stored) : [];
    if (this.cartItems.length === 0) {
      this.router.navigate(['/shop']);
    }

    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.user = JSON.parse(userStr);
      if (this.user) {
        this.deliveryForm.company_name = this.user.company_name || '';
        this.deliveryForm.full_name = this.user.contact_person || this.user.name || '';
        this.deliveryForm.phone = this.user.phone || '';
        this.deliveryForm.email = this.user.email || '';
        this.deliveryForm.delivery_address = this.user.address || '';
      }
    }
  }

  get subtotal() {
    return this.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  // Template aliases for backward-compatible HTML
  get orderItems() { return this.cartItems; }
  get taxes() { return 0; }
  get deliveryFee() { return 0; }
  get grandTotal() { return this.subtotal; }

  placeOrder() {
    if (!this.deliveryForm.delivery_address || !this.deliveryForm.full_name) {
      this.errorMessage = 'Please fill in all required delivery details.';
      return;
    }

    this.isPlacingOrder = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Place each cart item as a separate order
    const orderPromises = this.cartItems.map(item =>
      this.orderService.placeOrder({
        type: item.type,
        capacity: item.capacity,
        quantity: item.quantity,
        unit_price: item.price,
        delivery_address: this.deliveryForm.delivery_address,
        payment_method: this.paymentMethod,
        notes: this.deliveryForm.notes
      }).toPromise()
    );

    Promise.all(orderPromises)
      .then(() => {
        this.isPlacingOrder = false;
        this.successMessage = 'Your order has been placed! Awaiting admin approval.';
        sessionStorage.removeItem('fems_cart');
        setTimeout(() => this.router.navigate(['/dashboard']), 2000);
      })
      .catch(err => {
        this.isPlacingOrder = false;
        this.errorMessage = err?.error?.message || 'Failed to place order. Please try again.';
      });
  }

  backToCart() {
    this.router.navigate(['/cart']);
  }
}
