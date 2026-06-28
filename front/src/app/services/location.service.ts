import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';

  getLocations(page = 1, limit = 5): Observable<any> {
    return this.http.get(`${this.apiUrl}/locations?page=${page}&limit=${limit}`, { withCredentials: true });
  }

  getLocation(id: number | string): Observable<any> {
    return this.http.get(`${this.apiUrl}/locations/${id}`, { withCredentials: true });
  }

  getAvailableUnits(locationId: number | string, page = 1, limit = 5, search = ''): Observable<any> {
    let url = `${this.apiUrl}/locations/${locationId}/available-units?page=${page}&limit=${limit}`;
    if (search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    return this.http.get(url, { withCredentials: true });
  }

  createLocation(data: { location_name: string; address?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/locations`, data, { withCredentials: true });
  }

  deleteLocation(id: number | string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/locations/${id}`, { withCredentials: true });
  }

  addUnits(locationId: number | string, extinguisherIds: number[]): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/locations/${locationId}/units`,
      { extinguisher_ids: extinguisherIds },
      { withCredentials: true }
    );
  }

  removeUnits(locationId: number | string, extinguisherIds: number[]): Observable<any> {
    return this.http.request(
      'DELETE',
      `${this.apiUrl}/locations/${locationId}/units`,
      { body: { extinguisher_ids: extinguisherIds }, withCredentials: true }
    );
  }
}
