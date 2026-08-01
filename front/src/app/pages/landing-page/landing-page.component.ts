import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

declare const lucide: { createIcons: () => void } | undefined;

interface NavLink { label: string; href: string; }
interface Partner { name: string; sub: string; }
interface AboutCard { icon: string; title: string; desc: string; }
interface Testimonial { quote: string; name: string; role: string; initial: string; }

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
})
export class LandingPageComponent implements OnInit, OnDestroy {
  mobileMenuOpen = false;
  activeFaqId: number | null = null;

  navLinks: NavLink[] = [
    { label: 'Features', href: '#features' },
    { label: 'Process', href: '#process' },
    { label: 'Stories', href: '#stories' },
    { label: 'FAQ', href: '#faq' },
  ];

  stats = [
    { value: '10K+', suffix: '', label: 'Units tracked' },
    { value: '98', suffix: '%', label: 'Compliance' },
    { value: '60+', suffix: '', label: 'Client sites' },
    { value: '100', suffix: '%', label: 'Uptime' },
  ];

  partners: Partner[] = [
    { name: 'NFPA', sub: 'Fire codes' },
    { name: 'ISO 9001', sub: 'Quality mgmt' },
    { name: 'RBS', sub: 'Standards body' },
    { name: 'EN 3', sub: 'Extinguishers' },
    { name: 'OSHA', sub: 'Workplace safety' },
  ];

  aboutCards: AboutCard[] = [
    {
      icon: 'cpu',
      title: 'Smart Integration With Several Devices & Platforms',
      desc: 'FEMS integrates QR scanning, GPS mapping, and automated reporting — connect every site and unit in one place.',
    },
    {
      icon: 'hand-heart',
      title: 'Easy to Control, Built for Your Whole Team',
      desc: 'Intuitive dashboards for admins, inspectors, and clients so everyone can master fire safety without training.',
    },
    {
      icon: 'building-2',
      title: 'Flexible for Managing Every Room In Your Building',
      desc: 'Organise extinguishers by building, floor, and room with long-distance access to every location.',
    },
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
    {
      icon: 'radar',
      title: 'Weather & Risk Detector',
      desc: 'See risk levels for every site and get notified when conditions require extra care.',
      tags: ['Live risk', 'Alerts'],
    },
    {
      icon: 'gauge',
      title: 'Powerful Analytics',
      desc: 'Visualise order trends, stock levels, and inspection performance across your fleet.',
      tags: ['Charts', 'Trends'],
    },
  ];

  steps = [
    {
      title: 'Project Discovery Call',
      desc: 'We learn about your sites, fleet size, and compliance goals — then tailor FEMS to your needs.',
    },
    {
      title: 'Register & Onboard',
      desc: 'Sign up, verify your company, and import your extinguisher inventory in minutes.',
    },
    {
      title: 'Track & Assign Inspections',
      desc: 'Automated schedules, inspector assignments, and QR-based field reports keep everyone aligned.',
    },
    {
      title: 'Stay Audit-Ready',
      desc: 'Live compliance tracking, automatic reminders, and one-click audit reports for every site.',
    },
  ];

  testimonials: Testimonial[] = [
    {
      quote: 'FEMS cut our inspection admin time by 60%. We now know exactly which units need attention and when.',
      name: 'Diane Uwera',
      role: 'HSE Manager, Kigali',
      initial: 'D',
    },
    {
      quote: 'The single dashboard gave us full visibility across 14 sites. Audits that took a week now take an afternoon.',
      name: 'Jean Bosco',
      role: 'Facilities Director',
      initial: 'J',
    },
    {
      quote: 'Ordering refills and tracking deliveries is effortless. Our compliance score has never been higher.',
      name: 'Aline Mukamana',
      role: 'Operations Lead',
      initial: 'A',
    },
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
      setTimeout(() => lucide?.createIcons?.(), 300);
    }
  }

  ngOnDestroy(): void {}

  toggleFaqById(id: number): void {
    this.activeFaqId = this.activeFaqId === id ? null : id;
    setTimeout(() => lucide?.createIcons?.(), 30);
  }
}
