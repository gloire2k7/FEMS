import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials, { withCredentials: true });
  }

  signup(userData: any): Observable<any> {
    // For client signup, we ensure role_id is 3
    const data = { ...userData, role_id: 3 };
    return this.http.post(`${this.apiUrl}/users`, data);
  }

  createAdmin(adminData: any): Observable<any> {
    // role_id 2 for Admin
    const data = { ...adminData, role_id: 2 };
    return this.http.post(`${this.apiUrl}/users`, data, { withCredentials: true });
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true });
  }

  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  setUser(user: any): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  clearUser(): void {
    localStorage.removeItem('user');
  }
}
