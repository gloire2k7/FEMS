import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Product {
    name: string;
    model: string;
    badge: string;
    badgeClass: string;
    status: string;
    statusClass: string;
    capacity: string;
    warranty: string;
    supplier: string;
    price: number;
    oldPrice: number;
    image: string;
    imgBg: string;
    soldOut: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private initialProducts: Product[] = [
    {
      name: 'ProSafe CO₂ Extinguisher',
      model: 'PS-CO2-5000',
      badge: 'CO₂',
      badgeClass: 'bg-[#E0E7FF] text-[#4F46E5]',
      status: 'In Stock',
      statusClass: 'bg-[#22C55E] text-white',
      capacity: '5kg',
      warranty: '3 Years',
      supplier: 'FireTek Industries',
      price: 129,
      oldPrice: 99,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80',
      imgBg: 'bg-gradient-to-br from-slate-800 to-slate-900',
      soldOut: false
    },
    {
      name: 'AquaGuard Water Type',
      model: 'AG-H2O-9000',
      badge: 'WATER',
      badgeClass: 'bg-[#DBEAFE] text-[#2563EB]',
      status: 'In Stock',
      statusClass: 'bg-[#22C55E] text-white',
      capacity: '9L',
      warranty: '5 Years',
      supplier: 'SafeGuard Pro',
      price: 89,
      oldPrice: 99,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80',
      imgBg: 'bg-gradient-to-br from-slate-700 to-slate-800',
      soldOut: false
    },
    {
      name: 'FoamMax Premium',
      model: 'FM-PRO-6000',
      badge: 'FOAM',
      badgeClass: 'bg-[#FEF3C7] text-[#D97706]',
      status: 'Low Stock',
      statusClass: 'bg-[#F97316] text-white',
      capacity: '6L',
      warranty: '4 Years',
      supplier: 'Extinguish Co.',
      price: 149,
      oldPrice: 99,
      image: '',
      imgBg: 'bg-gradient-to-br from-pink-100 to-pink-200',
      soldOut: false
    },
    {
      name: 'DryShield ABC Powder',
      model: 'DS-ABC-12K',
      badge: 'POWDER',
      badgeClass: 'bg-[#E0E7FF] text-[#4F46E5]',
      status: 'In Stock',
      statusClass: 'bg-[#22C55E] text-white',
      capacity: '12kg',
      warranty: '5 Years',
      supplier: 'FireTek Industries',
      price: 179,
      oldPrice: 99,
      image: '',
      imgBg: 'bg-gradient-to-br from-red-100 to-red-200',
      soldOut: false
    },
    {
      name: 'CompactPro CO₂ Mini',
      model: 'CP-CO2-2000',
      badge: 'CO₂',
      badgeClass: 'bg-[#E0E7FF] text-[#4F46E5]',
      status: 'In Stock',
      statusClass: 'bg-[#22C55E] text-white',
      capacity: '2kg',
      warranty: '2 Years',
      supplier: 'SafeGuard Pro',
      price: 69,
      oldPrice: 99,
      image: '',
      imgBg: 'bg-gradient-to-br from-slate-200 to-slate-300',
      soldOut: false
    },
    {
      name: 'IndustrialMax Heavy',
      model: 'IM-PWD-25K',
      badge: 'POWDER',
      badgeClass: 'bg-[#E0E7FF] text-[#4F46E5]',
      status: 'Out of Stock',
      statusClass: 'bg-[#EF4444] text-white',
      capacity: '25kg',
      warranty: '7 Years',
      supplier: 'Extinguish Co.',
      price: 329,
      oldPrice: 99,
      image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=300&q=80',
      imgBg: 'bg-gradient-to-br from-orange-100 to-orange-200',
      soldOut: true
    }
  ];

  private productsSubject = new BehaviorSubject<Product[]>(this.initialProducts);
  products$ = this.productsSubject.asObservable();

  addProduct(product: Partial<Product>) {
    const newProduct: Product = {
      name: product.name || 'New Extinguisher',
      model: product.model || 'N/A',
      badge: product.badge || 'NEW',
      badgeClass: product.badgeClass || 'bg-[#E0E7FF] text-[#4F46E5]',
      status: 'In Stock',
      statusClass: 'bg-[#22C55E] text-white',
      capacity: product.capacity || 'N/A',
      warranty: product.warranty || '1 Year',
      supplier: product.supplier || 'Admin Added',
      price: product.price || 0,
      oldPrice: product.oldPrice || 0,
      image: product.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80',
      imgBg: product.imgBg || 'bg-gradient-to-br from-slate-200 to-slate-300',
      soldOut: false,
      ...product
    };
    
    this.productsSubject.next([...this.productsSubject.value, newProduct]);
  }
}
