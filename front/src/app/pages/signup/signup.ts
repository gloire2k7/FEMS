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
  password = '';
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
      password: this.password,
      company_name: this.company_name,
      phone: this.phone,
      address: this.address,
      role_id: 3 // Client
    };

    this.authService.signup(signupData).subscribe({
      next: () => {
        this.isLoading = false;
        this.error = '';
        alert('Registration submitted! An admin will review your account. You will receive an email once approved.');
        this.router.navigate(['/signin']);
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err.error?.message || 'Signup failed. Please try again.';
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
