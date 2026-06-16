import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ServiceRequestService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';

  getMyRequests(page = 1, limit = 5, type?: string): Observable<any> {
    let url = `${this.apiUrl}/service-requests?page=${page}&limit=${limit}`;
    if (type && type !== 'all') url += `&type=${encodeURIComponent(type)}`;
    return this.http.get(url, { withCredentials: true });
  }

  createRequest(data: {
    serial_number: string;
    service_type: string;
    preferred_date?: string;
    client_notes?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/service-requests`, data, { withCredentials: true });
  }

  confirmDone(id: number | string): Observable<any> {
    return this.http.put(`${this.apiUrl}/service-requests/${id}/confirm-done`, {}, { withCredentials: true });
  }

  getRefills(page = 1, status?: string): Observable<any> {
    let url = `${this.apiUrl}/service-requests/refills?page=${page}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    return this.http.get(url, { withCredentials: true });
  }

  getPendingInspections(page = 1): Observable<any> {
    return this.http.get(`${this.apiUrl}/service-requests/pending-inspections?page=${page}`, { withCredentials: true });
  }

  schedule(id: number | string, confirmedDate: string, fee?: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/service-requests/${id}/schedule`, {
      confirmed_date: confirmedDate,
      fee
    }, { withCredentials: true });
  }

  markDone(id: number | string): Observable<any> {
    return this.http.put(`${this.apiUrl}/service-requests/${id}/mark-done`, {}, { withCredentials: true });
  }

  assignInspection(id: number | string, inspectorId: number, confirmedDate: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/service-requests/${id}/assign-inspection`, {
      inspector_id: inspectorId,
      confirmed_date: confirmedDate
    }, { withCredentials: true });
  }

  getFees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/service-fees`, { withCredentials: true });
  }

  updateFees(refillFee: number, maintenanceFee: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/service-fees`, {
      refill_fee: refillFee,
      maintenance_fee: maintenanceFee
    }, { withCredentials: true });
  }
}
