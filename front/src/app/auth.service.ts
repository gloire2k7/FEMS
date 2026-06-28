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

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(
    email: string,
    otp: string,
    password: string,
    password_confirmation: string
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/reset-password`, {
      email,
      otp,
      password,
      password_confirmation,
    });
  }

  registerClient(data: {
    name: string;
    email: string;
    company_name: string;
    phone: string;
    address: string;
  }): Observable<{ message: string; email: string }> {
    return this.http.post<{ message: string; email: string }>(`${this.apiUrl}/register`, data);
  }

  verifyRegistrationOtp(email: string, otp: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/register/verify`, { email, otp });
  }

  resendRegistrationOtp(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/register/resend`, { email });
  }

  createAdmin(adminData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, { ...adminData, role_id: 2 }, { withCredentials: true });
  }

  createInspector(data: { name: string; email: string; role_id: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, data, { withCredentials: true });
  }

  getInspectors(page = 1, status?: string): Observable<any> {
    let url = `${this.apiUrl}/users/inspectors?page=${page}`;
    if (status && status !== 'all') url += `&status=${encodeURIComponent(status)}`;
    return this.http.get(url, { withCredentials: true });
  }

  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/roles`, { withCredentials: true });
  }

  setUserStatus(id: number, status: 'active' | 'inactive'): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}/status`, { status }, { withCredentials: true });
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

  getPermissionCatalog(): Observable<{
    groups: { name: string; permissions: { key: string; label: string; description: string }[] }[];
    role_defaults: Record<string, string[]>;
  }> {
    return this.http.get<any>(`${this.apiUrl}/permissions/catalog`, { withCredentials: true });
  }

  getUserDirectory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users/directory`, { withCredentials: true });
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

  resendClientCredentials(id: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/users/${id}/resend-credentials`, {}, { withCredentials: true });
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
          must_change_password: user.must_change_password ?? current.must_change_password,
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
    // Permission-driven for everyone — including Super Admin — so revoking a
    // permission immediately removes the corresponding tab/feature.
    // Baseline access everyone keeps so they can always reach their own basics.
    const alwaysGranted = ['dashboard.view', 'notifications.view', 'settings.view'];
    if (alwaysGranted.includes(key)) return true;
    return (user.permissions || []).includes(key);
  }

  hasAnyPermission(keys: string[]): boolean {
    return keys.some((k) => this.hasPermission(k));
  }

  /** Reports pages are audience-scoped; resolve to the right one by permission. */
  reportsRoute(): string {
    if (this.hasPermission('inspections.complete') && !this.hasPermission('orders.view') && !this.hasPermission('clients.view')) {
      return '/inspector-reports';
    }
    if (this.hasAnyPermission(['orders.view', 'clients.view', 'inventory.view', 'admins.view'])) {
      return '/super-admin-reports';
    }
    return '/reports';
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
