import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';

  getOrders(page = 1, limit = 5): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders?page=${page}&limit=${limit}`, { withCredentials: true });
  }

  getOrder(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/orders/${id}`, { withCredentials: true });
  }

  placeOrder(data: {
    type: string;
    capacity: string;
    quantity: number;
    delivery_address: string;
    payment_method: string;
    notes?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/orders`, data, { withCredentials: true });
  }

  grantOrder(id: number, data: { quantity: number; expected_delivery_date: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/orders/${id}/grant`, data, { withCredentials: true });
  }

  denyOrder(id: number, reason = ''): Observable<any> {
    return this.http.put(`${this.apiUrl}/orders/${id}/confirm`, { action: 'deny', reason }, { withCredentials: true });
  }

  confirmDelivery(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/orders/${id}/deliver`, {}, { withCredentials: true });
  }
}
