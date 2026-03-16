import { Component, AfterViewInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth.service';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
  selector: 'app-super-admin-add-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './super-admin-add-admin.html',
  styleUrl: './super-admin-add-admin.css',
})
export class SuperAdminAddAdmin implements AfterViewInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  name = '';
  email = '';
  
  isLoading = false;
  error = '';
  successData: any = null;

  ngAfterViewInit() {
    this.initIcons();
  }

  onCreateAdmin() {
    console.log('DEBUG: onCreateAdmin started', { name: this.name, email: this.email });
    this.isLoading = true;
    this.error = '';
    this.successData = null;
    this.cdr.detectChanges();

    this.authService.createAdmin({ name: this.name, email: this.email }).subscribe({
      next: (res) => {
        console.log('DEBUG: Response received', res);
        
        // Capture email before resetting form
        const createdEmail = this.email;
        
        this.isLoading = false;
        this.successData = {
          email: createdEmail,
          password: res.generated_password
        };
        
        // Reset form
        this.name = '';
        this.email = '';
        
        console.log('DEBUG: successData set', this.successData);
        
        // Force UI update
        this.cdr.detectChanges();
        
        // Re-init icons for the new success card
        setTimeout(() => {
          this.initIcons();
          this.cdr.detectChanges();
        }, 100);
      },
      error: (err) => {
        console.error('DEBUG: Request failed', err);
        this.isLoading = false;
        this.error = err.error?.message || 'Failed to create admin.';
        this.cdr.detectChanges();
      }
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  }

  private initIcons() {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
      setTimeout(() => lucide.createIcons(), 100);
      setTimeout(() => lucide.createIcons(), 500);
    }
  }
}
