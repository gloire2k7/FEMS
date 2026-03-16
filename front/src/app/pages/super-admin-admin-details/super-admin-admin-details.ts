import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
  selector: 'app-super-admin-admin-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './super-admin-admin-details.html',
  styleUrl: './super-admin-admin-details.css'
})
export class SuperAdminAdminDetails implements AfterViewInit {
  adminId: string | null = null;

  constructor(private route: ActivatedRoute) {
    this.adminId = this.route.snapshot.paramMap.get('id');
  }

  ngAfterViewInit() {
    this.initIcons();
  }

  private initIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
      // Double check because sometimes fonts or dynamic content delays rendering
      setTimeout(() => lucide.createIcons(), 100);
      setTimeout(() => lucide.createIcons(), 500);
    }
  }
}
