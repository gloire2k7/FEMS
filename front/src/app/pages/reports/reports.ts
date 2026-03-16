import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports implements AfterViewInit {
  reports = [
    {
      name: 'Monthly Compliance Report - Q1 2024',
      description: 'Complete facility audit results',
      type: 'Inspection Compliance',
      typeClass: 'bg-blue-100 text-blue-700',
      iconClass: 'bg-blue-500 text-white',
      icon: 'file-text',
      date: 'Jan 15, 2024',
      time: '09:30 AM',
      author: 'Sarah Johnson',
      role: 'Safety Manager',
      authorAvatar: 'https://i.pravatar.cc/150?u=sarah',
      format: 'PDF',
      formatClass: 'bg-[#EF4444] text-white',
      formatIcon: 'file'
    },
    {
      name: 'Expired Extinguisher Inventory - 2024',
      description: 'Units requiring immediate replacement',
      type: 'Expired',
      typeClass: 'bg-red-100 text-red-700',
      iconClass: 'bg-[#EF4444] text-white',
      icon: 'alert-triangle',
      date: 'Jan 12, 2024',
      time: '02:45 PM',
      author: 'Michael Chen',
      role: 'Compliance Officer',
      authorAvatar: 'https://i.pravatar.cc/150?u=michael',
      format: 'Excel',
      formatClass: 'bg-[#10B981] text-white',
      formatIcon: 'file-spreadsheet'
    },
    {
      name: 'Warehouse A - Location Summary',
      description: 'Equipment distribution by zone',
      type: 'Location Summary',
      typeClass: 'bg-yellow-100 text-yellow-700',
      iconClass: 'bg-[#F59E0B] text-white',
      icon: 'map',
      date: 'Jan 10, 2024',
      time: '11:20 AM',
      author: 'Emily Rodriguez',
      role: 'Facility Manager',
      authorAvatar: 'https://i.pravatar.cc/150?u=emily',
      format: 'PDF',
      formatClass: 'bg-[#EF4444] text-white',
      formatIcon: 'file'
    }
  ];

  filters = ['All Reports', 'Inventory', 'Expired', 'Inspection', 'Location'];
  activeFilter = 'All Reports';

  ngAfterViewInit() {
    setTimeout(() => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    }, 100);
  }
}
