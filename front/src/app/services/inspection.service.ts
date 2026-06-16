import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InspectionService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';

  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/inspection-assignments/stats`, { withCredentials: true });
  }

  getPool(page = 1, limit = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/inspection-assignments?pool=1&page=${page}&limit=${limit}`, { withCredentials: true });
  }

  getMine(page = 1, limit = 10, status?: string): Observable<any> {
    let url = `${this.apiUrl}/inspection-assignments?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return this.http.get(url, { withCredentials: true });
  }

  getAll(page = 1, limit = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/inspection-assignments?page=${page}&limit=${limit}`, { withCredentials: true });
  }

  createAssignment(extinguisherId: number, dueDate?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/inspection-assignments`, {
      extinguisher_id: extinguisherId,
      due_date: dueDate || null
    }, { withCredentials: true });
  }

  claim(id: number | string, confirmedDate: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/inspection-assignments/${id}/claim`, { confirmed_date: confirmedDate }, { withCredentials: true });
  }

  complete(id: number | string, data: { result_status: string; notes?: string; inspection_date?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/inspection-assignments/${id}/complete`, data, { withCredentials: true });
  }
}
