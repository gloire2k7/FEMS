import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OrderService } from '../../services/order.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit, AfterViewInit {
  private router = inject(Router);
  private orderService = inject(OrderService);

  cartItems: any[] = [];
  paymentMethod = 'mobile';
  user: any = null;

  deliveryForm = {
    company_name: '',
    full_name: '',
    phone: '',
    email: '',
    delivery_address: '',
    notes: ''
  };

  isPlacingOrder = false;
  successMessage = '';
  errorMessage = '';

  paymentOptions = [
    { id: 'mobile', label: 'Mobile Money', icon: 'smartphone' },
    { id: 'card', label: 'Card Payment', icon: 'credit-card' },
    { id: 'bank', label: 'Bank Transfer', icon: 'landmark' },
    { id: 'cash', label: 'Cash on Delivery', icon: 'banknote' },
  ];

  ngOnInit() {
    const stored = sessionStorage.getItem('fems_cart');
    this.cartItems = stored ? JSON.parse(stored) : [];
    if (this.cartItems.length === 0) {
      this.router.navigate(['/shop']);
    }

    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.user = JSON.parse(userStr);
      this.deliveryForm.company_name = this.user.company_name || '';
      this.deliveryForm.full_name = this.user.contact_person || this.user.name || '';
      this.deliveryForm.phone = this.user.phone || '';
      this.deliveryForm.email = this.user.email || '';
      this.deliveryForm.delivery_address = this.user.address || '';
    }
  }

  ngAfterViewInit() {
    setTimeout(() => lucide?.createIcons?.(), 50);
  }

  get subtotal() {
    return this.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  get grandTotal() {
    return this.subtotal;
  }

  get totalItems() {
    return this.cartItems.reduce((sum, i) => sum + i.quantity, 0);
  }

  placeOrder() {
    if (!this.deliveryForm.delivery_address?.trim() || !this.deliveryForm.full_name?.trim()) {
      this.errorMessage = 'Please fill in contact name and delivery address.';
      return;
    }
    if (!this.deliveryForm.phone?.trim() || !this.deliveryForm.email?.trim()) {
      this.errorMessage = 'Please fill in phone and email.';
      return;
    }

    this.isPlacingOrder = true;
    this.errorMessage = '';
    this.successMessage = '';

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
        this.successMessage = 'Order submitted successfully. Awaiting admin approval.';
        sessionStorage.removeItem('fems_cart');
        setTimeout(() => this.router.navigate(['/my-orders'], { queryParams: { status: 'pending' } }), 1800);
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
