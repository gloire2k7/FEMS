import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

export interface CartItem {
  type: string;
  capacity: string;
  price: number;
  quantity: number;
  total_in_stock: number;
}

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './shop.html',
  styleUrl: './shop.css',
})
export class Shop implements AfterViewInit, OnInit {
  private orderService = inject(OrderService);
  private router = inject(Router);

  isLoading = false;
  products: any[] = [];
  filteredProducts: any[] = [];

  filterType = '';
  maxPrice = 9999999;

  // Legacy filter fields still referenced in shop.html
  filterCapacity = '';
  filterAvailability = '';
  filterSupplier = '';
  currentPage = 1;
  totalPages = [1];

  /** Alias so shop.html {{ quantity }} still works */
  get quantity() { return this.modalQty; }

  /** Alias so shop.html addToCartAndGo() still works */
  addToCartAndGo() { this.addToCart(); }

  showModal = false;
  selectedProduct: any = null;
  modalQty = 1;

  cart: CartItem[] = [];

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.isLoading = true;
    this.orderService.getProducts().subscribe({
      next: (data: any[]) => {
        this.products = data.map(p => ({
          ...p,
          badge: p.type,
          price: Number(p.price) || 0,
          soldOut: p.total_in_stock <= 0,
          status: p.total_in_stock > 0 ? 'In Stock' : 'Sold Out',
          statusClass: p.total_in_stock > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600',
          imgBg: this.getImgBg(p.type),
          badgeClass: this.getBadgeClass(p.type)
        }));
        this.isLoading = false;
        this.applyFilter();
        this.initIcons();
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  applyFilter() {
    this.filteredProducts = this.products.filter(p => {
      const matchType = !this.filterType || p.type === this.filterType;
      const matchPrice = p.price <= this.maxPrice;
      return matchType && matchPrice;
    });
  }

  openProductModal(p: any) {
    if (p.total_in_stock <= 0) return;
    this.selectedProduct = p;
    this.modalQty = 1;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedProduct = null;
  }

  addToCart() {
    if (!this.selectedProduct) return;
    const existing = this.cart.find(c => c.type === this.selectedProduct.type && c.capacity === this.selectedProduct.capacity);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + this.modalQty, this.selectedProduct.total_in_stock);
    } else {
      this.cart.push({
        type: this.selectedProduct.type,
        capacity: this.selectedProduct.capacity,
        price: this.selectedProduct.price,
        quantity: this.modalQty,
        total_in_stock: this.selectedProduct.total_in_stock
      });
    }
    this.closeModal();
    // Persist cart to sessionStorage for checkout page
    sessionStorage.setItem('fems_cart', JSON.stringify(this.cart));
    this.router.navigate(['/cart']);
  }

  increaseQty() {
    if (this.selectedProduct && this.modalQty < this.selectedProduct.total_in_stock) this.modalQty++;
  }

  decreaseQty() {
    if (this.modalQty > 1) this.modalQty--;
  }

  get cartCount(): number {
    return this.cart.reduce((sum, c) => sum + c.quantity, 0);
  }

  goToCart() {
    this.router.navigate(['/cart']);
  }

  categories = ['Water', 'CO2', 'Powder', 'Foam'];

  ngAfterViewInit() {
    this.initIcons();
  }

  getImgBg(type: string): string {
    const t = type.toLowerCase();
    if (t.includes('water')) return 'bg-blue-50';
    if (t.includes('co2')) return 'bg-gray-100';
    if (t.includes('powder')) return 'bg-amber-50';
    if (t.includes('foam')) return 'bg-orange-50';
    return 'bg-red-50';
  }

  getBadgeClass(type: string): string {
    const t = type.toLowerCase();
    if (t.includes('water')) return 'bg-blue-600 text-white';
    if (t.includes('co2')) return 'bg-gray-800 text-white';
    if (t.includes('powder')) return 'bg-amber-500 text-white';
    if (t.includes('foam')) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  }

  private initIcons() {
    setTimeout(() => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    }, 100);
  }
}
