import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="max-w-lg mx-auto p-6 space-y-6">
      <h1 class="text-2xl font-black text-[#0B1437]">Settings</h1>
      <div class="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 class="font-bold text-sm uppercase text-slate-500">Change Password</h2>
        <input type="password" [(ngModel)]="current" placeholder="Current password" class="w-full border rounded-xl px-4 py-2 text-sm" />
        <input type="password" [(ngModel)]="newPass" placeholder="New password" class="w-full border rounded-xl px-4 py-2 text-sm" />
        <button (click)="changePassword()" class="w-full py-2 bg-[#0B1437] text-white rounded-xl text-sm font-bold">Update Password</button>
        <p *ngIf="msg" class="text-sm" [class.text-emerald-600]="ok" [class.text-red-600]="!ok">{{ msg }}</p>
      </div>
    </div>
  `
})
export class SettingsComponent {
  private auth = inject(AuthService);
  current = '';
  newPass = '';
  msg = '';
  ok = false;

  changePassword() {
    this.auth.changePassword(this.current, this.newPass).subscribe({
      next: () => { this.msg = 'Password updated.'; this.ok = true; this.current = ''; this.newPass = ''; },
      error: (e) => { this.msg = e.error?.message || 'Failed.'; this.ok = false; }
    });
  }
}
