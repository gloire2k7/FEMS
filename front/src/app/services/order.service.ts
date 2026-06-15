import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';

  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/shop/products`, { withCredentials: true });
  }

  getOrders(page = 1, limit = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders?page=${page}&limit=${limit}`, { withCredentials: true });
  }

  getOrder(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/${id}`, { withCredentials: true });
  }

  placeOrder(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders`, data, { withCredentials: true });
  }

  approveOrder(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/orders/${id}/grant`, {}, { withCredentials: true });
  }

  denyOrder(id: number, reason = ''): Observable<any> {
    return this.http.put(`${this.apiUrl}/orders/${id}/confirm`, { action: 'deny', reason }, { withCredentials: true });
  }

  deliverOrder(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/orders/${id}/deliver`, {}, { withCredentials: true });
  }
}
