import { Component, AfterViewInit, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './signin.html',
  styleUrls: ['./signin.css']
})
export class SigninComponent implements AfterViewInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  isLoading = false;
  error = '';

  ngAfterViewInit() {
    this.initIcons();
  }

  onSubmit() {
    this.isLoading = true;
    this.error = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.authService.setUser(response.user);

        // Redirect based on role
        if (response.user.role === 'Super Admin') {
          this.router.navigate(['/super-admin-dashboard']);
        } else if (response.user.role === 'Admin') {
          this.router.navigate(['/admin-dashboard']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Login failed. Please check your credentials.';
      }
    });
  }

  private initIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
      setTimeout(() => lucide.createIcons(), 100);
    }
  }
}
