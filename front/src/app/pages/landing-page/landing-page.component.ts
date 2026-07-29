import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

declare const lucide: { createIcons: () => void } | undefined;

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
})
export class LandingPageComponent implements OnInit, OnDestroy {
  mobileMenuOpen = false;
  activeSection: 'features' | 'how' | 'faq' = 'features';
  activeFaqId: number | null = null;

  sectionTabs = [
    { id: 'features' as const, label: 'Features' },
    { id: 'how' as const, label: 'How it works' },
    { id: 'faq' as const, label: 'FAQ' },
  ];

  stats = [
    { value: '10K+', suffix: '', label: 'Units tracked' },
    { value: '99.8', suffix: '%', label: 'Compliance' },
    { value: '60+', suffix: '', label: 'Client sites' },
    { value: '100', suffix: '%', label: 'Uptime' },
  ];

  previewSites = [
    { name: 'HQ Main Office', status: 'Compliant', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
    { name: 'Warehouse B', status: 'Due soon', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700' },
    { name: 'Retail Floor 2', status: 'Compliant', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700' },
  ];

  features = [
    {
      icon: 'package',
      title: 'Smart Inventory',
      desc: 'Track every unit by serial number and QR code with real-time status across all sites.',
      tags: ['Live sync', 'QR codes', 'Bulk import'],
    },
    {
      icon: 'shield-check',
      title: 'Compliance Engine',
      desc: 'Proactive alerts, automated inspection schedules, and audit-ready record archives.',
      tags: ['Auto alerts', 'Audit logs'],
    },
    {
      icon: 'clipboard-list',
      title: 'Inspection Workflows',
      desc: 'Assign field teams, capture results on any device, and print QR inspection labels.',
      tags: ['Field ready', 'QR labels'],
    },
    {
      icon: 'map-pin',
      title: 'Multi-Site Hub',
      desc: 'Unlimited locations with GPS mapping and full extinguisher traceability.',
      tags: ['GPS', 'Multi-site'],
    },
    {
      icon: 'shopping-bag',
      title: 'Product Catalog',
      desc: 'Clients order units and refills; admins approve, allocate stock, and deliver.',
      tags: ['E-commerce', 'Stock control'],
    },
    {
      icon: 'sparkles',
      title: 'AI Assistant',
      desc: 'Instant answers on compliance, procedures, and operational guidance 24/7.',
      tags: ['AI powered', 'Contextual'],
    },
  ];

  steps = [
    { title: 'Register company', desc: 'Sign up, verify email, and get approved by an admin.' },
    { title: 'Add locations', desc: 'Map buildings and sites with GPS coordinates.' },
    { title: 'Import inventory', desc: 'Bulk-import your fleet or add units individually.' },
    { title: 'Stay compliant', desc: 'Automated inspections, alerts, and reports.' },
  ];

  faqs = [
    {
      id: 1,
      q: 'Can I manage multiple locations?',
      a: 'Yes. FEMS supports unlimited locations per client, each with GPS coordinates and custom hierarchies for buildings, floors, and rooms.',
    },
    {
      id: 2,
      q: 'How do compliance reminders work?',
      a: 'The system tracks manufacture dates, inspection dates, and due dates — sending email alerts 30 days before any unit needs attention.',
    },
    {
      id: 3,
      q: 'What roles are supported?',
      a: 'Super Admin, Admin, Inspector, and Client roles with fine-grained permissions. Access is fully customizable per user.',
    },
    {
      id: 4,
      q: 'Can inspectors use mobile devices?',
      a: 'FEMS is fully responsive. Inspectors scan QR codes, capture results, and submit reports directly from the field.',
    },
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => lucide?.createIcons?.(), 80);
    }
  }

  ngOnDestroy(): void {}

  toggleFaqById(id: number): void {
    this.activeFaqId = this.activeFaqId === id ? null : id;
    setTimeout(() => lucide?.createIcons?.(), 30);
  }
}
