import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MandatoryInspectionService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api/mandatory-inspections';

  getTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/types`, { withCredentials: true });
  }

  createType(data: { name: string; interval_months: number; deadline_days: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/types`, data, { withCredentials: true });
  }

  updateType(id: number, data: { name: string; interval_months: number; deadline_days: number }): Observable<any> {
    return this.http.put(`${this.apiUrl}/types/${id}`, data, { withCredentials: true });
  }

  deleteType(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/types/${id}`, { withCredentials: true });
  }

  getAssignments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/assignments`, { withCredentials: true });
  }

  createAssignment(data: { mandatory_type_id: number; client_id: number; inspector_id: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/assignments`, data, { withCredentials: true });
  }

  deleteAssignment(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/assignments/${id}`, { withCredentials: true });
  }

  getMine(page = 1, limit = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/mine?page=${page}&limit=${limit}`, { withCredentials: true });
  }

  complete(id: number, data: { result_status: string; notes?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/complete`, data, { withCredentials: true });
  }
}
