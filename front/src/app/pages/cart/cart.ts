import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit {
  private router = inject(Router);

  items: any[] = [];
  client: any = null;

  ngOnInit() {
    const stored = sessionStorage.getItem('fems_cart');
    this.items = stored ? JSON.parse(stored) : [];
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
      this.client = JSON.parse(userStr);
    }
  }

  get subtotal() {
    return this.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  get taxes() {
    return 0; // No tax applied in RWF; keeping for template compatibility
  }

  get deliveryFee() {
    return 0; // Free delivery; keeping for template compatibility
  }

  get grandTotal() {
    return this.subtotal;
  }

  get totalItems() {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  increase(item: any) {
    if (item.quantity < item.total_in_stock) {
      item.quantity++;
      this.saveCart();
    }
  }

  decrease(item: any) {
    if (item.quantity > 1) {
      item.quantity--;
      this.saveCart();
    }
  }

  removeItem(index: number) {
    this.items.splice(index, 1);
    this.saveCart();
  }

  clearCart() {
    this.items = [];
    this.saveCart();
  }

  saveCart() {
    sessionStorage.setItem('fems_cart', JSON.stringify(this.items));
  }

  continueShopping() { this.router.navigate(['/shop']); }

  goToCheckOut() {
    if (this.items.length === 0) return;
    this.router.navigate(['/checkout']);
  }
}
