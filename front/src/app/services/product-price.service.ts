import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductPriceService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';

  getPrices(): Observable<{ prices: any[]; types: string[]; capacities: string[] }> {
    return this.http.get<any>(`${this.apiUrl}/product-prices`, { withCredentials: true });
  }

  lookup(type: string, capacity: string): Observable<{ unit_price: number; type: string; capacity: string }> {
    return this.http.get<any>(
      `${this.apiUrl}/product-prices/lookup?type=${encodeURIComponent(type)}&capacity=${encodeURIComponent(capacity)}`,
      { withCredentials: true }
    );
  }

  updatePrices(prices: { type: string; capacity: string; price: number }[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/product-prices`, { prices }, { withCredentials: true });
  }
}
