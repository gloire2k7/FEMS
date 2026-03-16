import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
  selector: 'app-super-admin-admins',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './super-admin-admins.html',
  styleUrl: './super-admin-admins.css',
})
export class SuperAdminAdmins implements AfterViewInit {

  ngAfterViewInit() {
    this.initIcons();
  }

  private initIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
      setTimeout(() => lucide.createIcons(), 100);
      setTimeout(() => lucide.createIcons(), 500);
    }
  }
}
