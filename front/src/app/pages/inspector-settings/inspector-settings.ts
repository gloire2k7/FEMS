import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-inspector-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-lg">
      <h1 class="text-2xl font-bold text-[#0B1437] mb-2">Settings</h1>
      <p class="text-slate-500 mb-8">Manage your account.</p>

      <section class="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <p class="text-sm text-slate-500">Signed in as</p>
        <p class="font-semibold text-[#0B1437]">{{ userName }}</p>
        <p class="text-sm text-slate-600">{{ userEmail }}</p>
      </section>

      <section class="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 class="text-lg font-semibold text-[#0B1437] mb-4">Change password</h2>
        <p *ngIf="passwordMessage" class="mb-4 text-sm px-3 py-2 rounded-lg"
          [class.bg-emerald-50]="!passwordError" [class.text-emerald-700]="!passwordError"
          [class.bg-red-50]="passwordError" [class.text-red-700]="passwordError">{{ passwordMessage }}</p>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">Current password</label>
            <input type="password" [(ngModel)]="currentPassword" class="w-full px-3 py-2 border border-slate-200 rounded-lg" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">New password</label>
            <input type="password" [(ngModel)]="newPassword" class="w-full px-3 py-2 border border-slate-200 rounded-lg" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">Confirm new password</label>
            <input type="password" [(ngModel)]="confirmPassword" class="w-full px-3 py-2 border border-slate-200 rounded-lg" />
          </div>
          <button type="button" (click)="changePassword()"
            class="px-5 py-2 rounded-lg bg-[#0B1437] text-white text-sm font-semibold">Update password</button>
        </div>
      </section>
    </div>
  `
})
export class InspectorSettingsComponent implements OnInit, AfterViewInit {
  private auth = inject(AuthService);

  userName = '';
  userEmail = '';
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordMessage = '';
  passwordError = false;

  ngOnInit() {
    const user = this.auth.getUser();
    this.userName = user?.name ?? '';
    this.userEmail = user?.email ?? '';
  }

  changePassword() {
    this.passwordMessage = '';
    this.passwordError = false;
    if (!this.currentPassword || !this.newPassword) {
      this.passwordMessage = 'Please fill in all fields.';
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
        this.currentPassword = this.newPassword = this.confirmPassword = '';
        const u = this.auth.getUser();
        if (u) { u.must_change_password = false; this.auth.setUser(u); }
      },
      error: (err) => {
        this.passwordMessage = err?.error?.message || 'Could not update password.';
        this.passwordError = true;
      }
    });
  }

  ngAfterViewInit() { setTimeout(() => lucide?.createIcons?.(), 50); }
}
