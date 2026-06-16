import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api';
  private userSubject = new BehaviorSubject<any>(this.readStoredUser());
  readonly user$ = this.userSubject.asObservable();

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials, { withCredentials: true }).pipe(
      tap((res: any) => this.setUser(res.user))
    );
  }

  signup(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, { ...userData, role_id: 3 });
  }

  createAdmin(adminData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, { ...adminData, role_id: 2 }, { withCredentials: true });
  }

  getAdmins(page = 1, status?: string): Observable<any> {
    let url = `${this.apiUrl}/users/admins?page=${page}`;
    if (status && status !== 'all') {
      url += `&status=${encodeURIComponent(status)}`;
    }
    return this.http.get(url, { withCredentials: true });
  }

  getClients(page = 1, status?: string): Observable<any> {
    let url = `${this.apiUrl}/users/clients?page=${page}`;
    if (status) url += `&status=${status}`;
    return this.http.get(url, { withCredentials: true });
  }

  getPendingClients(page = 1): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/pending-clients?page=${page}`, { withCredentials: true });
  }

  getPermissions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/permissions`, { withCredentials: true });
  }

  getUserById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${id}`, { withCredentials: true });
  }

  updateUser(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}`, data, { withCredentials: true });
  }

  setAdminStatus(id: number, status: 'active' | 'inactive'): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}/status`, { status }, { withCredentials: true });
  }

  approveClient(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}/approve`, {}, { withCredentials: true });
  }

  rejectClient(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}/reject`, {}, { withCredentials: true });
  }

  changePassword(current: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/change-password`, {
      current_password: current,
      new_password: newPassword
    }, { withCredentials: true });
  }

  refreshMe(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`, { withCredentials: true }).pipe(
      tap((user: any) => {
        const current = this.getUser() || {};
        this.setUser({
          ...current,
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role_name || user.role || current.role,
          permissions: user.permissions || [],
          status: user.status,
          company_id: user.company_id ?? current.company_id,
        });
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true });
  }

  getUser(): any {
    return this.userSubject.value ?? this.readStoredUser();
  }

  setUser(user: any): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.userSubject.next(user);
  }

  clearUser(): void {
    localStorage.removeItem('user');
    this.userSubject.next(null);
  }

  hasPermission(key: string): boolean {
    const user = this.getUser();
    if (!user) return false;
    if (user.role === 'Super Admin') return true;
    const alwaysGranted = ['manage_notifications', 'manage_settings', 'manage_ai_assistant'];
    if (alwaysGranted.includes(key)) return true;
    return (user.permissions || []).includes(key);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`, { withCredentials: true });
  }

  isRole(...roles: string[]): boolean {
    const user = this.getUser();
    return user ? roles.includes(user.role) : false;
  }

  private readStoredUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}
