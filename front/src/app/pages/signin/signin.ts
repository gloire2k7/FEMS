import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
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
export class SigninComponent implements OnInit, AfterViewInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  isLoading = false;
  error = '';
  successMessage = '';

  ngOnInit() {
    if (this.route.snapshot.queryParamMap.get('reset') === 'success') {
      this.successMessage = 'Your password was reset. Sign in with your new password.';
    }
  }

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
        } else if (response.user.role === 'Inspector') {
          this.router.navigate(['/inspector-dashboard']);
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

  goToSignup() {
    this.router.navigate(['/signup']);
  }
}
