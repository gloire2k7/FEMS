import { Component, OnInit, OnDestroy, HostListener, Inject, PLATFORM_ID } from '@angular/core';
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
  // Nav state
  isScrolled = false;
  mobileMenuOpen = false;

  // FAQ
  activeFaqId: number | null = null;

  // ── Static data ────────────────────────────────────────────────

  stats = [
    { value: '10K+', suffix: '',  label: 'Units Tracked' },
    { value: '99.8', suffix: '%', label: 'Compliance Rate' },
    { value: '60+',  suffix: '',  label: 'Client Sites' },
    { value: '100',  suffix: '%', label: 'System Uptime' },
  ];

  aboutPoints = [
    'Real-time inventory tracking with serial number & QR code support',
    'Automated compliance reminders 30 days before expiry',
    'Multi-location GPS mapping with field inspector assignment',
    'Integrated product catalog with streamlined order fulfillment',
    'Role-based access for Super Admins, Admins, Inspectors & Clients',
    'AI assistant for instant operational guidance',
  ];

  features = [
    {
      icon: 'package',
      title: 'Smart Inventory Matrix',
      desc: 'Track every unit by serial number and QR code. Monitor pressure levels, chemical loads, status flags — all in real time across every site.',
      tags: ['Live Sync', 'QR Codes', 'Bulk Import'],
      featured: false,
    },
    {
      icon: 'shield-check',
      title: 'Automated Compliance Engine',
      desc: 'Zero missed deadlines. FEMS fires proactive alerts at 30-day windows, auto-generates inspection schedules, and archives every record for audits.',
      tags: ['Auto-Alerts', 'Audit Logs', 'Zero Gaps'],
      featured: true,
    },
    {
      icon: 'clipboard-list',
      title: 'Inspection Workflows',
      desc: 'Assign inspections to field teams. Inspectors capture pressure, weight, seal condition and outcomes from any device. Labels print with QR codes.',
      tags: ['Field Ready', 'QR Labels', 'Photo Capture'],
      featured: false,
    },
    {
      icon: 'map-pin',
      title: 'Multi-Site Location Hub',
      desc: 'Each client manages unlimited locations with GPS coordinates. Assign extinguishers to specific rooms, floors and buildings with full traceability.',
      tags: ['GPS Mapping', 'Multi-Site', 'Floor Plans'],
      featured: false,
    },
    {
      icon: 'shopping-bag',
      title: 'Integrated Product Catalog',
      desc: 'Clients browse and order replacement units, refills, or accessories through a built-in shop. Admins approve, allocate stock and mark as delivered.',
      tags: ['E-Commerce', 'Stock Control', 'Fast Delivery'],
      featured: false,
    },
    {
      icon: 'sparkles',
      title: 'AI Safety Assistant',
      desc: 'An always-on AI assistant answers compliance questions, guides inspectors through procedures, and surfaces anomalies before they become incidents.',
      tags: ['AI Powered', '24/7 Support', 'Contextual'],
      featured: false,
    },
  ];

  steps = [
    {
      icon: 'user-plus',
      title: 'Register Your Company',
      desc: 'Sign up, verify your email, and get approved by an admin in minutes. No credit card required.',
    },
    {
      icon: 'map-pin',
      title: 'Add Your Locations',
      desc: 'Map all your buildings and sites with GPS coordinates and organize them by floor or zone.',
    },
    {
      icon: 'package',
      title: 'Import Your Inventory',
      desc: 'Bulk-import your extinguisher fleet or add units individually with serial numbers and expiry dates.',
    },
    {
      icon: 'shield-check',
      title: 'Stay Compliant Automatically',
      desc: 'FEMS schedules inspections, sends alerts, and generates compliance reports — fully on autopilot.',
    },
  ];

  testimonials = [
    {
      name: 'James Kamali',
      role: 'Head of Safety, RwandaBuilds Ltd',
      initials: 'JK',
      avatarGrad: 'linear-gradient(135deg, #8C1D24, #5A0E12)',
      quote: 'FEMS transformed how we manage 600+ extinguishers across 12 buildings. Compliance is now effortless — we haven\'t failed an audit since we went live.',
    },
    {
      name: 'Amina Mukasa',
      role: 'Compliance Officer, Kigali Heights',
      initials: 'AM',
      avatarGrad: 'linear-gradient(135deg, #C0392B, #7F1D1D)',
      quote: 'The inspection workflow is brilliant. My field team uses it on their phones, and I see results in real time from my office. Total visibility.',
    },
    {
      name: 'Patrick Osei',
      role: 'Safety Director, AfriTech Group',
      initials: 'PO',
      avatarGrad: 'linear-gradient(135deg, #991B1B, #450A0A)',
      quote: 'Before FEMS, compliance was a spreadsheet nightmare. Now it\'s automated. The AI assistant alone saves my team 4 hours every week.',
    },
    {
      name: 'Diane Uwimana',
      role: 'Facility Manager, EastPark Mall',
      initials: 'DU',
      avatarGrad: 'linear-gradient(135deg, #7F1D1D, #3D0709)',
      quote: 'The multi-location feature is a game changer. We manage 5 sites and FEMS gives us one dashboard to rule them all. Outstanding product.',
    },
    {
      name: 'Emmanuel Nkurunziza',
      role: 'Inspector, FireSafe Rwanda',
      initials: 'EN',
      avatarGrad: 'linear-gradient(135deg, #B91C1C, #6E1318)',
      quote: 'As a field inspector, having QR-code-based labels and a mobile-friendly interface is everything. I can complete and submit inspections on-site instantly.',
    },
    {
      name: 'Sophie Ingabire',
      role: 'Operations Lead, Kigali Arena',
      initials: 'SI',
      avatarGrad: 'linear-gradient(135deg, #DC2626, #8C1D24)',
      quote: 'FEMS\'s order management is seamless. We request refills, the admin approves, and our technician arrives the same day. That efficiency is rare.',
    },
  ];

  faqs = [
    {
      id: 1,
      q: 'Can I manage multiple locations and buildings?',
      a: 'Absolutely. FEMS supports unlimited locations per client account, each with GPS coordinates. You can organize extinguishers by building, floor, room, or any custom hierarchy that matches your facility layout.',
    },
    {
      id: 2,
      q: 'How do compliance reminders and alerts work?',
      a: 'FEMS tracks each extinguisher\'s manufacture date, last inspection date, and next due date. The system automatically sends email notifications 30 days before any unit is due for inspection or refill — so you\'re never caught off guard.',
    },
    {
      id: 3,
      q: 'What roles are supported in the platform?',
      a: 'FEMS has four built-in roles: Super Admin (full system oversight), Admin (manage clients, inventory, and compliance), Inspector (field inspection assignments and reporting), and Client (view own fleet, request services, place orders). Access is permission-driven and fully customizable.',
    },
    {
      id: 4,
      q: 'Can inspectors use FEMS on mobile devices?',
      a: 'Yes — FEMS is fully responsive and works on any modern smartphone or tablet. Field inspectors can access their assigned work, scan QR codes, capture inspection results, and submit reports directly from the field.',
    },
    {
      id: 5,
      q: 'How does the ordering and refill workflow work?',
      a: 'Clients browse a product catalog (extinguisher units, tags, accessories) and place orders directly in FEMS. Admins review and approve the order, allocate stock, and mark it as delivered — all with a full audit trail.',
    },
    {
      id: 6,
      q: 'Is there an API or integration support?',
      a: 'FEMS exposes a full REST JSON API used internally by the frontend. Any third-party integration that supports REST can connect to the FEMS backend for data exchange, reporting, or automation.',
    },
  ];

  // ── Intersection Observer for section reveals ──────────────────
  private observer: IntersectionObserver | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Lucide icons initial render
      setTimeout(() => lucide?.createIcons?.(), 80);

      // Intersection observer for scroll-reveal
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('visible');
              // Re-init lucide icons when new sections appear
              setTimeout(() => lucide?.createIcons?.(), 50);
            }
          });
        },
        { threshold: 0.12 }
      );
      document.querySelectorAll('.reveal-section').forEach((el) => {
        this.observer?.observe(el);
      });
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 40;
  }

  toggleFaqById(id: number): void {
    this.activeFaqId = this.activeFaqId === id ? null : id;
    // Re-render lucide icons after state change
    setTimeout(() => lucide?.createIcons?.(), 30);
  }

  scrollToSection(id: string): void {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
}
