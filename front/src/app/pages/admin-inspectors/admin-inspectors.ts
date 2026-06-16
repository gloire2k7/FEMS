import { AfterViewInit, Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';
import { PaginationComponent } from '../../shared/pagination/pagination.component';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-admin-inspectors',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  template: `
    <div class="client-page max-w-5xl">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-[#0B1437]">Inspectors</h1>
          <p class="text-slate-500 mt-1">Create and manage field inspectors.</p>
        </div>
        <button type="button" (click)="showForm = !showForm" class="client-btn-primary text-sm">
          Add inspector
        </button>
      </div>

      <section *ngIf="showForm" class="client-card p-6 mb-6">
        <h2 class="text-lg font-semibold text-[#0B1437] mb-4">New inspector</h2>
        <p *ngIf="createError" class="text-sm text-red-600 mb-3">{{ createError }}</p>
        <p *ngIf="createSuccess" class="text-sm text-emerald-700 mb-3">{{ createSuccess }}</p>
        <div class="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">Full name *</label>
            <input type="text" [(ngModel)]="newName" class="client-input w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-600 mb-1">Email *</label>
            <input type="email" [(ngModel)]="newEmail" class="client-input w-full" />
          </div>
        </div>
        <button type="button" (click)="create()" [disabled]="creating || !newName.trim() || !newEmail.trim()"
          class="client-btn-primary disabled:opacity-40">Create &amp; send invite</button>
      </section>

      <section class="client-card overflow-hidden">
        <div *ngIf="loading" class="client-empty py-12 text-slate-400">Loading inspectors…</div>
        <div *ngIf="!loading && inspectors.length === 0" class="client-empty py-12">No inspectors yet.</div>
        <div *ngIf="!loading && inspectors.length" class="client-table-wrap">
          <table class="client-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let i of inspectors">
                <td class="font-semibold text-[#0B1437]">{{ i.name }}</td>
                <td>{{ i.email }}</td>
                <td>
                  <span class="client-badge" [class.bg-emerald-50]="i.status === 'active'"
                    [class.text-emerald-700]="i.status === 'active'"
                    [class.bg-slate-100]="i.status !== 'active'"
                    [class.text-slate-600]="i.status !== 'active'">{{ i.status }}</span>
                </td>
                <td class="text-slate-600">{{ i.created_at | date:'mediumDate' }}</td>
                <td class="text-right">
                  <button type="button" (click)="toggleStatus(i)"
                    class="text-sm font-medium text-blue-600 hover:underline">
                    {{ i.status === 'active' ? 'Deactivate' : 'Activate' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="px-5 pb-2" *ngIf="total > 0">
          <app-pagination [page]="page" [lastPage]="lastPage" [total]="total" (pageChange)="load($event)" />
        </div>
      </section>
    </div>
  `
})
export class AdminInspectors implements OnInit, AfterViewInit {
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  inspectors: any[] = [];
  page = 1;
  lastPage = 1;
  total = 0;
  inspectorRoleId = 0;
  showForm = false;
  newName = '';
  newEmail = '';
  creating = false;
  createError = '';
  createSuccess = '';

  ngOnInit() {
    this.auth.getRoles().subscribe({
      next: (roles) => {
        const r = roles.find(x => x.name === 'Inspector');
        this.inspectorRoleId = r?.id ?? 0;
      }
    });
    this.load(1);
  }

  load(page: number) {
    this.loading = true;
    this.page = page;
    this.auth.getInspectors(page).subscribe({
      next: (res) => {
        this.inspectors = res.data ?? [];
        this.total = res.total ?? 0;
        this.lastPage = res.last_page ?? 1;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  create() {
    if (!this.inspectorRoleId) {
      this.createError = 'Inspector role not found. Run database migration v4.';
      return;
    }
    this.creating = true;
    this.createError = '';
    this.createSuccess = '';
    this.auth.createInspector({
      name: this.newName.trim(),
      email: this.newEmail.trim(),
      role_id: this.inspectorRoleId
    }).subscribe({
      next: (res) => {
        this.createSuccess = res.message || 'Inspector created. Credentials sent by email.';
        this.newName = '';
        this.newEmail = '';
        this.showForm = false;
        this.creating = false;
        this.load(1);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.createError = err.error?.message || 'Failed to create inspector.';
        this.creating = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleStatus(inspector: any) {
    const next = inspector.status === 'active' ? 'inactive' : 'active';
    this.auth.setAdminStatus(inspector.id, next).subscribe({
      next: () => this.load(this.page),
      error: () => {}
    });
  }

  ngAfterViewInit() { setTimeout(() => lucide?.createIcons?.(), 50); }
}
