import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed bottom-6 right-6 z-[100]">
      <button *ngIf="!open" (click)="open = true"
        class="w-14 h-14 rounded-full bg-[#0B1437] text-white shadow-xl flex items-center justify-center hover:scale-105 transition-transform">
        <span class="text-xl">✦</span>
      </button>
      <div *ngIf="open" class="w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        <div class="bg-[#0B1437] text-white px-4 py-3 flex justify-between items-center">
          <span class="text-sm font-bold">FEMS Assistant</span>
          <button (click)="open = false" class="opacity-70 hover:opacity-100">✕</button>
        </div>
        <div class="h-48 overflow-y-auto p-3 space-y-2 text-sm">
          <div *ngFor="let m of messages" [class.text-right]="m.role === 'user'"
            class="p-2 rounded-lg" [class.bg-slate-100]="m.role === 'user'" [class.bg-blue-50]="m.role === 'bot'">
            {{ m.text }}
          </div>
        </div>
        <div class="p-3 border-t flex gap-2">
          <input [(ngModel)]="input" (keyup.enter)="send()" placeholder="Ask about FEMS..."
            class="flex-1 text-xs border rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-blue-400" />
          <button (click)="send()" class="px-3 py-2 bg-[#0B1437] text-white rounded-lg text-xs font-bold">Send</button>
        </div>
      </div>
    </div>
  `
})
export class AiAssistantComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  open = false;
  input = '';
  messages = [{ role: 'bot', text: 'Hi! I can help you navigate FEMS. Try: "How do I approve an order?" or "Where is stock?"' }];

  send() {
    const q = this.input.trim();
    if (!q) return;
    this.messages.push({ role: 'user', text: q });
    this.input = '';
    this.messages.push({ role: 'bot', text: this.answer(q) });
  }

  private answer(q: string): string {
    const lower = q.toLowerCase();
    const user = this.auth.getUser();
    const role = user?.role || 'guest';

    if (lower.includes('order') && lower.includes('approve')) {
      if (role === 'Super Admin') return 'Go to Admin Orders or your dashboard pending orders card. Open an order and click Approve.';
      if (role === 'Admin' && this.auth.hasPermission('manage_orders')) return 'Open Admin Orders from the sidebar to approve or deny client requests.';
      return 'Order approval requires Admin or Super Admin with manage_orders permission.';
    }
    if (lower.includes('stock') || lower.includes('inventory')) {
      return 'Stock is under Admin Inventory. Super Admin and admins with manage_stock can register units there.';
    }
    if (lower.includes('client') && lower.includes('approv')) {
      return 'Pending clients appear in Super Admin → Clients. Approve them to grant portal access.';
    }
    if (lower.includes('password')) {
      return 'After login, go to Settings to change your password.';
    }
    if (lower.includes('track') && lower.includes('order')) {
      this.router.navigate(['/my-orders']);
      return 'Opening My Orders where you can track status: pending, approved, denied, or delivered.';
    }
    if (role === 'Company User') {
      return 'As a client you can browse Shop, place orders, and track them under My Orders. Need help with something specific?';
    }
    return 'I can help with orders, stock, client approval, permissions, and navigation. What would you like to do?';
  }
}
