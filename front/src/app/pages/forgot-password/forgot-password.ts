import { Component, AfterViewInit, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['../signin/signin.css'],
})
export class ForgotPasswordComponent implements AfterViewInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  isLoading = false;
  error = '';
  sent = false;

  ngAfterViewInit() {
    this.initIcons();
  }

  onSubmit() {
    this.isLoading = true;
    this.error = '';
    this.sent = false;

    this.auth.forgotPassword(this.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.sent = true;
        this.initIcons();
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Something went wrong. Please try again.';
      },
    });
  }

  continueToReset() {
    this.router.navigate(['/reset-password'], { queryParams: { email: this.email } });
  }

  resendCode() {
    this.sent = false;
    this.onSubmit();
  }

  private initIcons() {
    setTimeout(() => lucide?.createIcons?.(), 0);
    setTimeout(() => lucide?.createIcons?.(), 100);
  }
}
