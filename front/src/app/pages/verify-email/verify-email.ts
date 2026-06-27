import { Component, AfterViewInit, OnInit, inject } from '@angular/core';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterModule, FormsModule, CommonModule],
  templateUrl: './verify-email.html',
  styleUrls: ['../signin/signin.css'],
})
export class VerifyEmailComponent implements OnInit, AfterViewInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  otp = '';
  isLoading = false;
  error = '';
  success = false;
  resendMessage = '';

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

    this.isLoading = true;
    this.error = '';
    this.resendMessage = '';

    this.auth.verifyRegistrationOtp(this.email, this.otp).subscribe({
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

  resendCode() {
    if (!this.email) {
      this.error = 'Enter your email to resend the code.';
      return;
    }
    this.resendMessage = '';
    this.error = '';
    this.auth.resendRegistrationOtp(this.email).subscribe({
      next: (res) => {
        this.resendMessage = res.message || 'A new code has been sent.';
      },
      error: (err) => {
        this.error = err.error?.message || 'Could not resend the code. Try again.';
      },
    });
  }

  goToSignin() {
    this.router.navigate(['/signin']);
  }

  private initIcons() {
    setTimeout(() => lucide?.createIcons?.(), 0);
    setTimeout(() => lucide?.createIcons?.(), 100);
  }
}
