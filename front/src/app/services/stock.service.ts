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

  getUnits(page = 1, status = 'in_stock', sort = 'newest'): Observable<any> {
    return this.http.get(`${this.apiUrl}/extinguishers?page=${page}&limit=5&status=${status}&sort=${sort}`, { withCredentials: true });
  }

  registerBulk(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/extinguishers/bulk`, data, { withCredentials: true });
  }
}
