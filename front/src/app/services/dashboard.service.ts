import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';

  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard/stats`, { withCredentials: true });
  }
}
