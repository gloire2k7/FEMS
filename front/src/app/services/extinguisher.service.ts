import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExtinguisherService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';

  bulkCreate(data: { type: string; capacity: string; expiry_date: string; count: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/extinguishers/bulk`, data, { withCredentials: true });
  }

  getExtinguishers(page = 1, limit = 15): Observable<any> {
    return this.http.get(`${this.apiUrl}/extinguishers?page=${page}&limit=${limit}`, { withCredentials: true });
  }

  getExtinguisher(idOrSerial: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/extinguishers/${idOrSerial}`, { withCredentials: true });
  }

  assignLocation(idOrSerial: string, locationId: number | null): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/extinguishers/${idOrSerial}/location`,
      { location_id: locationId },
      { withCredentials: true }
    );
  }
}
