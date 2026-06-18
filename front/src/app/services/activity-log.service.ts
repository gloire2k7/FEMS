import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ActivityLogEntry {
  id: number;
  log_id: string;
  name: string;
  email: string;
  role: string;
  action: string;
  action_key: string;
  entity: string;
  entity_type: string;
  entity_label: string;
  details: string;
  date: string;
  time: string;
  actionClass: string;
  roleClass: string;
}

export interface ActivityLogStats {
  total: number;
  today: number;
  critical: number;
  active_users_today: number;
  last_activity_at: string | null;
}

export interface EntityBreakdown {
  entity_type: string;
  label: string;
  count: number;
  percent: number;
}

export interface ActivityLogsResponse {
  data: ActivityLogEntry[];
  total: number;
  page: number;
  last_page: number;
  stats: ActivityLogStats;
  entity_breakdown: EntityBreakdown[];
}

@Injectable({ providedIn: 'root' })
export class ActivityLogService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api/activity-logs';

  list(page = 1, entity = 'all', search = ''): Observable<ActivityLogsResponse> {
    const params = new URLSearchParams({ page: String(page), limit: '5' });
    if (entity && entity !== 'all') params.set('entity', entity);
    if (search.trim()) params.set('search', search.trim());
    return this.http.get<ActivityLogsResponse>(`${this.apiUrl}?${params}`, { withCredentials: true });
  }

  exportCsv(entity = 'all', search = ''): Observable<{ file_path: string }> {
    const params = new URLSearchParams();
    if (entity && entity !== 'all') params.set('entity', entity);
    if (search.trim()) params.set('search', search.trim());
    const qs = params.toString();
    return this.http.get<{ file_path: string }>(
      `${this.apiUrl}/export${qs ? '?' + qs : ''}`,
      { withCredentials: true }
    );
  }
}
