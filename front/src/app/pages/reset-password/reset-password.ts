import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './reset-password.html',
  styleUrls: ['../signin/signin.css'],
})
export class ResetPasswordComponent implements OnInit, AfterViewInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  otp = '';
  password = '';
  passwordConfirmation = '';
  isLoading = false;
  error = '';
  success = false;

  ngOnInit() {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
  }

  ngAfterViewInit() {
    this.initIcons();
  }

  onSubmit() {
    if (!this.email) {
      this.error = 'Email is required.';
      return;
    }
    if (this.otp.replace(/\D/g, '').length !== 6) {
      this.error = 'Enter the 6-digit verification code from your email.';
      return;
    }
    if (this.password.length < 8) {
      this.error = 'Password must be at least 8 characters.';
      return;
    }
    if (this.password !== this.passwordConfirmation) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.auth.resetPassword(this.email, this.otp, this.password, this.passwordConfirmation).subscribe({
      next: () => {
        this.isLoading = false;
        this.success = true;
        this.initIcons();
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Invalid or expired code. Request a new one.';
      },
    });
  }

  goToSignin() {
    this.router.navigate(['/signin'], { queryParams: { reset: 'success' } });
  }

  goToForgot() {
    this.router.navigate(['/forgot-password']);
  }

  private initIcons() {
    setTimeout(() => lucide?.createIcons?.(), 0);
    setTimeout(() => lucide?.createIcons?.(), 100);
  }
}
