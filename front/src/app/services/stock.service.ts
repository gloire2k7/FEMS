import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StockService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';

  getSummary(recentPage = 1): Observable<any> {
    return this.http.get(`${this.apiUrl}/extinguishers/stock?recent_page=${recentPage}`, { withCredentials: true });
  }

  getUnits(page = 1, status = 'in_stock', sort = 'newest', type = ''): Observable<any> {
    let url = `${this.apiUrl}/extinguishers?page=${page}&limit=5&status=${status}&sort=${sort}`;
    if (type) {
      url += `&type=${encodeURIComponent(type)}`;
    }
    return this.http.get(url, { withCredentials: true });
  }

  updateUnit(id: number, data: Record<string, unknown>): Observable<any> {
    return this.http.put(`${this.apiUrl}/extinguishers/${id}`, data, { withCredentials: true });
  }

  deleteUnit(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/extinguishers/${id}`, { withCredentials: true });
  }

  registerBulk(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/extinguishers/bulk`, data, { withCredentials: true });
  }
}
