import { Component, OnInit, inject, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MandatoryInspectionService } from '../../services/mandatory-inspection.service';
import { AuthService } from '../../auth.service';
import { HttpClient } from '@angular/common/http';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-admin-mandatory-inspections',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-mandatory-inspections.html',
  styleUrl: './admin-mandatory-inspections.css',
})
export class AdminMandatoryInspections implements OnInit, AfterViewInit {
  private svc = inject(MandatoryInspectionService);
  private auth = inject(AuthService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  loadingPage = true;
  savingType = false;
  savingAssignment = false;
  deletingTypeId: number | null = null;
  deletingAssignmentId: number | null = null;

  types: any[] = [];
  assignments: any[] = [];
  clients: any[] = [];
  inspectors: any[] = [];
  message = '';
  messageError = false;
  editingType: number | null = null;
  typeForm = { name: '', interval_months: 6, deadline_days: 30 };
  assignForm = { mandatory_type_id: null as number | null, client_id: null as number | null, inspector_id: null as number | null };

  ngOnInit() {
    this.load();
    this.http.get<any[]>('http://localhost:8000/api/clients', { withCredentials: true }).subscribe({
      next: (c) => { this.clients = c ?? []; this.cdr.detectChanges(); }
    });
    this.auth.getInspectors(1, 'active').subscribe({
      next: (res) => { this.inspectors = res.data ?? []; this.cdr.detectChanges(); }
    });
  }

  load() {
    this.loadingPage = true;
    let pending = 2;
    const done = () => { if (--pending <= 0) { this.loadingPage = false; this.cdr.detectChanges(); this.refreshIcons(); } };
    this.svc.getTypes().subscribe({
      next: (t) => { this.types = t ?? []; done(); },
      error: () => done()
    });
    this.svc.getAssignments().subscribe({
      next: (a) => { this.assignments = a ?? []; done(); },
      error: () => done()
    });
  }

  saveType() {
    if (!this.typeForm.name.trim() || this.savingType) return;
    this.savingType = true;
    this.message = '';
    const obs = this.editingType
      ? this.svc.updateType(this.editingType, this.typeForm)
      : this.svc.createType(this.typeForm);
    obs.subscribe({
      next: (res) => {
        this.message = res.message;
        this.messageError = false;
        this.savingType = false;
        this.cancelEdit();
        this.load();
      },
      error: (err) => {
        this.message = err.error?.message || 'Failed to save type.';
        this.messageError = true;
        this.savingType = false;
        this.cdr.detectChanges();
      }
    });
  }

  editType(t: any) {
    this.editingType = +t.id;
    this.typeForm = { name: t.name, interval_months: +t.interval_months, deadline_days: +t.deadline_days };
  }

  cancelEdit() {
    this.editingType = null;
    this.typeForm = { name: '', interval_months: 6, deadline_days: 30 };
  }

  deleteType(id: number) {
    if (!confirm('Delete this mandatory inspection type?') || this.deletingTypeId) return;
    this.deletingTypeId = id;
    this.svc.deleteType(id).subscribe({
      next: () => { this.deletingTypeId = null; this.load(); },
      error: () => { this.deletingTypeId = null; this.cdr.detectChanges(); }
    });
  }

  saveAssignment() {
    if (!this.assignForm.mandatory_type_id || !this.assignForm.client_id || !this.assignForm.inspector_id || this.savingAssignment) return;
    this.savingAssignment = true;
    this.message = '';
    this.svc.createAssignment({
      mandatory_type_id: this.assignForm.mandatory_type_id!,
      client_id: this.assignForm.client_id!,
      inspector_id: this.assignForm.inspector_id!,
    }).subscribe({
      next: (res) => {
        this.message = res.message;
        this.messageError = false;
        this.savingAssignment = false;
        this.assignForm = { mandatory_type_id: null, client_id: null, inspector_id: null };
        this.load();
      },
      error: (err) => {
        this.message = err.error?.message || 'Failed to assign.';
        this.messageError = true;
        this.savingAssignment = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteAssignment(id: number) {
    if (!confirm('Remove this assignment?') || this.deletingAssignmentId) return;
    this.deletingAssignmentId = id;
    this.svc.deleteAssignment(id).subscribe({
      next: () => { this.deletingAssignmentId = null; this.load(); },
      error: () => { this.deletingAssignmentId = null; this.cdr.detectChanges(); }
    });
  }

  ngAfterViewInit() { this.refreshIcons(); }
  private refreshIcons() { setTimeout(() => lucide?.createIcons?.(), 50); }
}
