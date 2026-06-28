import { Component, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css']
})
export class SignupComponent implements AfterViewInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  name = '';
  email = '';
  company_name = '';
  phone = '';
  address = '';
  
  isLoading = false;
  error = '';

  ngAfterViewInit() {
    this.initIcons();
  }

  onSubmit() {
    this.isLoading = true;
    this.error = '';

    const signupData = {
      name: this.name,
      email: this.email,
      company_name: this.company_name,
      phone: this.phone,
      address: this.address,
    };

    this.authService.registerClient(signupData).subscribe({
      next: () => {
        this.isLoading = false;
        this.error = '';
        this.router.navigate(['/verify-email'], { queryParams: { email: this.email } });
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Registration failed. Please try again.';
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
