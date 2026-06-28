import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface AiChatResponse {
  reply: string;
  suggestions?: string[];
  action?: { route: string; label: string; query?: Record<string, string> };
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';

  chat(message: string): Observable<AiChatResponse> {
    return this.http.post<AiChatResponse>(`${this.apiUrl}/ai/chat`, { message }, { withCredentials: true });
  }
}
