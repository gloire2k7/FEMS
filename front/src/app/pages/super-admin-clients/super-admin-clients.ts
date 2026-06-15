import { Component, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../auth.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-super-admin-clients',
  standalone: true,
  imports: [CommonModule, RouterModule, PaginationComponent],
  template: `
    <div class="flex h-screen bg-[#F8FAFC] font-['Poppins']">
      <aside class="w-48 bg-[#0B1437] shrink-0 flex flex-col p-4 text-white">
        <a routerLink="/super-admin-dashboard" class="block py-2 text-slate-400 hover:text-white text-sm">Dashboard</a>
        <a routerLink="/super-admin-admins" class="block py-2 text-slate-400 hover:text-white text-sm">Admins</a>
        <a routerLink="/super-admin-clients" class="block py-2 text-white font-bold text-sm">Clients</a>
      </aside>
      <main class="flex-1 p-8 overflow-y-auto">
        <h1 class="text-2xl font-black text-[#0B1437] mb-2">Client Approvals</h1>
        <div class="flex gap-2 mb-6">
          <button (click)="switchTab('pending')" [class.bg-[#0B1437]]="tab==='pending'" [class.text-white]="tab==='pending'"
            class="px-4 py-2 rounded-xl text-sm font-bold border">Pending</button>
          <button (click)="switchTab('active')" [class.bg-[#0B1437]]="tab==='active'" [class.text-white]="tab==='active'"
            class="px-4 py-2 rounded-xl text-sm font-bold border">Approved</button>
        </div>
        <div *ngIf="loading" class="text-slate-400">Loading…</div>
        <div class="space-y-4" *ngIf="!loading">
          <div *ngFor="let c of clients" class="bg-white rounded-2xl p-6 border border-slate-100 flex flex-wrap justify-between gap-4">
            <div>
              <h3 class="font-black">{{ c.company_name || c.name }}</h3>
              <p class="text-sm text-slate-500">{{ c.email }} · {{ c.phone }}</p>
              <p class="text-xs text-slate-400 mt-1">{{ c.address }}</p>
            </div>
            <div class="flex gap-2 items-center" *ngIf="tab === 'pending'">
              <button (click)="approve(c)" class="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold">Approve</button>
              <button (click)="reject(c)" class="px-4 py-2 bg-red-100 text-red-700 rounded-xl text-xs font-bold">Reject</button>
            </div>
            <span *ngIf="tab === 'active'" class="text-xs font-bold text-emerald-600 px-3 py-1 bg-emerald-50 rounded-full h-fit">Active</span>
          </div>
          <p *ngIf="clients.length === 0" class="text-slate-400 text-center py-8">No clients in this list.</p>
        </div>
        <app-pagination [page]="page" [lastPage]="lastPage" [total]="total" (pageChange)="load($event)" />
      </main>
    </div>
  `
})
export class SuperAdminClients implements AfterViewInit {
  private auth = inject(AuthService);
  clients: any[] = [];
  tab: 'pending' | 'active' = 'pending';
  page = 1;
  lastPage = 1;
  total = 0;
  loading = true;

  ngAfterViewInit() { this.load(1); }

  switchTab(tab: 'pending' | 'active') { this.tab = tab; this.load(1); }

  load(page: number) {
    this.loading = true;
    this.page = page;
    const req = this.tab === 'pending' ? this.auth.getPendingClients(page) : this.auth.getClients(page, 'active');
    req.subscribe({
      next: (res) => {
        this.clients = res.data || [];
        this.page = res.page;
        this.lastPage = res.last_page;
        this.total = res.total;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  approve(c: any) { this.auth.approveClient(c.id).subscribe(() => this.load(this.page)); }
  reject(c: any) { this.auth.rejectClient(c.id).subscribe(() => this.load(this.page)); }
}
