import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
  selector: 'app-clients-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive],
  templateUrl: './clients-dashboard.html',
  styleUrl: './clients-dashboard.css',
})
export class ClientsDashboard implements AfterViewInit {
  inspectionsOpen = true;

  toggleInspections() {
    this.inspectionsOpen = !this.inspectionsOpen;
    this.initIcons();
  }
  ngAfterViewInit() {
    this.initIcons();
  }

  private initIcons() {
    const run = () => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    };

    run();
    [100, 300, 600, 1000, 2000].forEach(delay => {
      setTimeout(run, delay);
    });
  }
}
