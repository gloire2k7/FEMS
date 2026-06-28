import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ComplianceAlert {
  id: string;
  extinguisherId: string;
  type: string;
  capacity: string;
  location: string;
  urgency: 'URGENT' | 'HIGH' | 'MEDIUM';
  description: string;
  timestamp: string;
  urgencyDetail: string;
  category?: string;
  link?: string;
}

@Injectable({ providedIn: 'root' })
export class ComplianceService {
  private http = inject(HttpClient);

  getAlerts(): Observable<{ alerts: ComplianceAlert[]; urgentCount: number; highCount: number }> {
    return this.http.get<any>('http://localhost:8000/api/compliance/alerts', { withCredentials: true });
  }
}
