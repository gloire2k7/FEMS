import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StockService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';

  getSummary(): Observable<any> {
    return this.http.get(`${this.apiUrl}/extinguishers/stock`, { withCredentials: true });
  }

  getUnits(page = 1, inStock = true): Observable<any> {
    return this.http.get(`${this.apiUrl}/extinguishers?page=${page}&limit=15&in_stock=${inStock ? 1 : 0}`, { withCredentials: true });
  }

  registerBulk(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/extinguishers/bulk`, data, { withCredentials: true });
  }
}
