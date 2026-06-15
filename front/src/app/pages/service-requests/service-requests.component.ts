import { Component, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-service-requests',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  template: `
    <div class="client-page">
      <section class="client-hero">
        <div class="client-hero-inner flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p class="client-hero-eyebrow">Maintenance</p>
            <h1 class="client-hero-title">Service Requests</h1>
            <p class="client-hero-sub">Request refills, maintenance, or inspections for your extinguishers.</p>
          </div>
          <button type="button" (click)="openModal()" class="client-hero-btn shrink-0">
            <i data-lucide="plus" class="w-5 h-5"></i>
            New request
          </button>
        </div>
      </section>

      <section class="client-card">
        <div class="client-empty">
          <div class="client-empty-icon">
            <i data-lucide="clipboard-list" class="w-8 h-8"></i>
          </div>
          <p class="text-lg font-semibold text-[#0B1437]">No active requests</p>
          <p class="text-base text-slate-500 mt-2">When you submit a service request, it will appear here with its status.</p>
          <button type="button" (click)="openModal()" class="client-btn-primary mt-6">Submit a request</button>
        </div>
      </section>

      <!-- Modal -->
      <div *ngIf="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-[#0B1437]/50 backdrop-blur-sm" (click)="closeModal()"></div>
        <div class="relative client-card w-full max-w-lg p-8 shadow-xl">
          <button type="button" (click)="closeModal()"
            class="absolute top-4 right-4 w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>

          <h2 class="text-2xl font-bold text-[#0B1437] mb-1">New service request</h2>
          <p class="text-base text-slate-500 mb-6">Fill in the details below. We'll get back to you shortly.</p>

          <form class="space-y-5" (ngSubmit)="submitRequest()">
            <div>
              <label class="client-label">Extinguisher serial</label>
              <input type="text" [(ngModel)]="serviceRequest.extinguisherId" name="extId"
                placeholder="e.g. FEMS-20240101-ABC12" class="client-input" required />
            </div>
            <div>
              <label class="client-label">Location</label>
              <input type="text" [(ngModel)]="serviceRequest.location" name="location"
                placeholder="Building, floor, or room" class="client-input" />
            </div>
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="client-label">Service type</label>
                <select [(ngModel)]="serviceRequest.serviceType" name="serviceType" class="client-input" required>
                  <option value="">Select…</option>
                  <option *ngFor="let t of serviceTypes" [value]="t.value">{{ t.label }}</option>
                </select>
              </div>
              <div>
                <label class="client-label">Priority</label>
                <select [(ngModel)]="serviceRequest.priority" name="priority" class="client-input">
                  <option *ngFor="let p of priorities" [value]="p">{{ p }}</option>
                </select>
              </div>
            </div>
            <div>
              <label class="client-label">Preferred date</label>
              <input type="date" [(ngModel)]="serviceRequest.preferredDate" name="preferredDate" class="client-input" />
            </div>
            <div>
              <label class="client-label">Additional notes</label>
              <textarea [(ngModel)]="serviceRequest.additionalNotes" name="notes" rows="3"
                placeholder="Describe the issue or special instructions…"
                class="client-input resize-none"></textarea>
            </div>
            <div class="flex gap-3 pt-2">
              <button type="button" (click)="closeModal()" class="client-btn-secondary flex-1">Cancel</button>
              <button type="submit" class="client-btn-primary flex-1">Submit request</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class ServiceRequestsComponent implements AfterViewInit {
  showModal = false;

  serviceTypes = [
    { value: 'refill', label: 'Refill' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'repair', label: 'Repair' },
  ];

  priorities = ['Low', 'Medium', 'High', 'Urgent'];

  serviceRequest = {
    extinguisherId: '',
    location: '',
    serviceType: '',
    priority: 'Medium',
    preferredDate: '',
    additionalNotes: ''
  };

  ngAfterViewInit() {
    this.refreshIcons();
  }

  openModal() {
    this.showModal = true;
    setTimeout(() => this.refreshIcons(), 50);
  }

  closeModal() {
    this.showModal = false;
    this.resetForm();
  }

  resetForm() {
    this.serviceRequest = {
      extinguisherId: '',
      location: '',
      serviceType: '',
      priority: 'Medium',
      preferredDate: '',
      additionalNotes: ''
    };
  }

  submitRequest() {
    console.log('Service Request Submitted:', this.serviceRequest);
    this.closeModal();
  }

  private refreshIcons() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}
