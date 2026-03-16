import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';

  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/shop/products`, { withCredentials: true });
  }

  getOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/orders`, { withCredentials: true });
  }

  placeOrder(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders`, data, { withCredentials: true });
  }

  approveOrder(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/orders/${id}/grant`, {}, { withCredentials: true });
  }

  denyOrder(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/orders/${id}/confirm`, { action: 'deny' }, { withCredentials: true });
  }
}
