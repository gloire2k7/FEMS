import { Component, AfterViewInit, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-settings.html',
  styleUrls: ['./admin-settings.css'],
})
export class AdminSettings implements OnInit, AfterViewInit {
  private auth = inject(AuthService);

  userName = '';
  userEmail = '';
  userRole = 'Admin';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordMessage = '';
  passwordError = false;

  ngOnInit() {
    const user = this.auth.getUser();
    this.userName = user?.name ?? '';
    this.userEmail = user?.email ?? '';
    this.userRole = user?.role_name || user?.role || 'Admin';
  }

  changePassword() {
    this.passwordMessage = '';
    this.passwordError = false;
    if (!this.currentPassword || !this.newPassword) {
      this.passwordMessage = 'Please fill in all password fields.';
      this.passwordError = true;
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordMessage = 'New passwords do not match.';
      this.passwordError = true;
      return;
    }
    if (this.newPassword.length < 8) {
      this.passwordMessage = 'Password must be at least 8 characters.';
      this.passwordError = true;
      return;
    }
    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.passwordMessage = 'Password updated successfully.';
        this.passwordError = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        this.passwordMessage = err?.error?.message || 'Could not update password.';
        this.passwordError = true;
      },
    });
  }

  ngAfterViewInit() {
    this.refreshIcons();
  }

  private refreshIcons() {
    setTimeout(() => lucide?.createIcons?.(), 0);
    setTimeout(() => lucide?.createIcons?.(), 120);
  }
}
