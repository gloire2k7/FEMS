import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="client-page max-w-2xl">
      <section class="client-hero">
        <div class="client-hero-inner">
          <p class="client-hero-eyebrow">Account</p>
          <h1 class="client-hero-title">Settings</h1>
          <p class="client-hero-sub">Manage your profile and security preferences.</p>
        </div>
      </section>

      <section class="client-card client-card--lift p-6">
        <h2 class="text-lg font-semibold text-[#0B1437] mb-4">Account</h2>
        <dl class="space-y-4 text-base">
          <div class="flex flex-col sm:flex-row sm:gap-4">
            <dt class="text-slate-500 sm:w-32 shrink-0">Name</dt>
            <dd class="font-medium text-[#0B1437]">{{ user?.name || '—' }}</dd>
          </div>
          <div class="flex flex-col sm:flex-row sm:gap-4">
            <dt class="text-slate-500 sm:w-32 shrink-0">Email</dt>
            <dd class="font-medium text-[#0B1437]">{{ user?.email || '—' }}</dd>
          </div>
          <div class="flex flex-col sm:flex-row sm:gap-4" *ngIf="user?.company_name">
            <dt class="text-slate-500 sm:w-32 shrink-0">Company</dt>
            <dd class="font-medium text-[#0B1437]">{{ user.company_name }}</dd>
          </div>
        </dl>
      </section>

      <section class="client-card client-card--lift p-6 space-y-5">
        <div>
          <h2 class="text-lg font-semibold text-[#0B1437]">Change password</h2>
          <p class="text-base text-slate-500 mt-1">Use a strong password you don't use elsewhere.</p>
        </div>
        <div>
          <label class="client-label">Current password</label>
          <input type="password" [(ngModel)]="current" class="client-input" autocomplete="current-password" />
        </div>
        <div>
          <label class="client-label">New password</label>
          <input type="password" [(ngModel)]="newPass" class="client-input" autocomplete="new-password" />
        </div>
        <button type="button" (click)="changePassword()" class="client-btn-primary w-full sm:w-auto">
          Update password
        </button>
        <p *ngIf="msg" class="text-base" [class.text-emerald-600]="ok" [class.text-red-600]="!ok">{{ msg }}</p>
      </section>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  private auth = inject(AuthService);
  user: any = null;
  current = '';
  newPass = '';
  msg = '';
  ok = false;

  ngOnInit() {
    this.user = this.auth.getUser();
  }

  changePassword() {
    this.auth.changePassword(this.current, this.newPass).subscribe({
      next: () => { this.msg = 'Password updated successfully.'; this.ok = true; this.current = ''; this.newPass = ''; },
      error: (e) => { this.msg = e.error?.message || 'Failed to update password.'; this.ok = false; }
    });
  }
}
