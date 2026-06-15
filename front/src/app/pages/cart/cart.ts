import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit, AfterViewInit {
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

  ngAfterViewInit() {
    this.refreshIcons();
  }

  get subtotal() {
    return this.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  get grandTotal() {
    return this.subtotal;
  }

  get totalItems() {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  getImgBg(type: string): string {
    const t = (type || '').toLowerCase();
    if (t.includes('water')) return 'bg-blue-50';
    if (t.includes('co2')) return 'bg-slate-100';
    if (t.includes('powder')) return 'bg-amber-50';
    if (t.includes('foam')) return 'bg-orange-50';
    return 'bg-red-50';
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
    setTimeout(() => this.refreshIcons(), 50);
  }

  clearCart() {
    this.items = [];
    this.saveCart();
    setTimeout(() => this.refreshIcons(), 50);
  }

  saveCart() {
    sessionStorage.setItem('fems_cart', JSON.stringify(this.items));
  }

  continueShopping() {
    this.router.navigate(['/shop']);
  }

  goToCheckOut() {
    if (this.items.length === 0) return;
    this.router.navigate(['/checkout']);
  }

  private refreshIcons() {
    setTimeout(() => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    }, 50);
  }
}
