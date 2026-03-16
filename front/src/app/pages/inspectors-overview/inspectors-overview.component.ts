import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface Inspector {
  id: string;
  name: string;
  title: string;
  location: string;
  status: 'available' | 'busy';
  phone: string;
  email: string;
  yearsExperience: number;
  inspectionsCompleted: number;
  certifications: string[];
  lastInspectionDate: string;
  avatar?: string;
}

@Component({
  selector: 'app-inspectors-overview',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './inspectors-overview.component.html',
  styleUrls: ['./inspectors-overview.component.css']
})
export class InspectorsOverviewComponent {
  selectedInspector: Inspector | null = null;
  searchTerm = '';
  currentPage = 1;
  itemsPerPage = 6;

  inspectors: Inspector[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      title: 'Senior Fire Safety Inspector',
      location: 'New York, NY',
      status: 'available',
      phone: '+1 (555) 123-4567',
      email: 'sarah.j@company.com',
      yearsExperience: 8,
      inspectionsCompleted: 1247,
      certifications: ['ISO 9001 Lead', 'OSHA Certified', 'Safety First L2'],
      lastInspectionDate: '2023-10-15',
      avatar: 'https://i.pravatar.cc/150?u=sarah'
    },
    {
      id: '2',
      name: 'Michael Chen',
      title: 'Structural Engineer',
      location: 'Industrial District',
      status: 'busy',
      phone: '+1 (555) 012-3456',
      email: 'inspector@company.com',
      yearsExperience: 8,
      inspectionsCompleted: 1200,
      certifications: ['ISO 9001 Lead', 'OSHA Certified', 'Safety First L2'],
      lastInspectionDate: '2023-10-24',
      avatar: 'https://i.pravatar.cc/150?u=michael'
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      title: 'Safety Compliance Officer',
      location: 'Houston, TX',
      status: 'available',
      phone: '+1 (555) 345-6789',
      email: 'emily.r@company.com',
      yearsExperience: 5,
      inspectionsCompleted: 656,
      certifications: ['OSHA Certified', 'Hazard Analysis L2'],
      lastInspectionDate: '2023-10-13',
      avatar: 'https://i.pravatar.cc/150?u=emily'
    },
    {
      id: '4',
      name: 'David Kim',
      title: 'Fire Extinguisher Expert',
      location: 'Chicago, IL',
      status: 'busy',
      phone: '+1 (555) 456-7890',
      email: 'david.k@company.com',
      yearsExperience: 10,
      inspectionsCompleted: 1523,
      certifications: ['ISO 9001 Lead', 'NFPA Certified', 'Safety First L2'],
      lastInspectionDate: '2023-10-12',
      avatar: 'https://i.pravatar.cc/150?u=david'
    },
    {
      id: '5',
      name: 'Lisa Thompson',
      title: 'Emergency Systems Inspector',
      location: 'Phoenix, AZ',
      status: 'available',
      phone: '+1 (555) 567-8901',
      email: 'lisa.t@company.com',
      yearsExperience: 7,
      inspectionsCompleted: 987,
      certifications: ['Emergency Systems L2', 'OSHA Certified'],
      lastInspectionDate: '2023-10-11',
      avatar: 'https://i.pravatar.cc/150?u=lisa'
    },
    {
      id: '6',
      name: 'James Wilson',
      title: 'Industrial Safety Inspector',
      location: 'Philadelphia, PA',
      status: 'available',
      phone: '+1 (555) 678-9012',
      email: 'james.w@company.com',
      yearsExperience: 9,
      inspectionsCompleted: 1434,
      certifications: ['Industrial Safety L3', 'ISO 9001 Lead'],
      lastInspectionDate: '2023-10-10',
      avatar: 'https://i.pravatar.cc/150?u=james'
    }
  ];

  get filteredInspectors() {
    const filtered = this.inspectors.filter(inspector =>
      inspector.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      inspector.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      inspector.location.toLowerCase().includes(this.searchTerm.toLowerCase())
    );

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return filtered.slice(start, end);
  }

  get totalPages() {
    const filtered = this.inspectors.filter(inspector =>
      inspector.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      inspector.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      inspector.location.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    return Math.ceil(filtered.length / this.itemsPerPage);
  }

  get totalInspectors() {
    return this.inspectors.length;
  }

  get availableInspectors() {
    return this.inspectors.filter(i => i.status === 'available').length;
  }

  get busyInspectors() {
    return this.inspectors.filter(i => i.status === 'busy').length;
  }

  selectInspector(inspector: Inspector) {
    this.selectedInspector = inspector;
  }

  closeInspectorDetails() {
    this.selectedInspector = null;
  }

  bookInspector() {
    if (this.selectedInspector) {
      console.log('Booking inspector:', this.selectedInspector.name);
      // Here you would typically navigate to a booking form or open a modal
    }
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getStatusColor(status: string) {
    return status;
  }

  getCertificationColor(certification: string) {
    const colors: { [key: string]: string } = {
      'ISO 9001 Lead': 'bg-blue-100 text-blue-700',
      'OSHA Certified': 'bg-orange-100 text-orange-700',
      'Safety First L2': 'bg-purple-100 text-purple-700',
      'NFPA Certified': 'bg-red-100 text-red-700',
      'Electrical Safety L1': 'bg-yellow-100 text-yellow-700',
      'Hazard Analysis L2': 'bg-indigo-100 text-indigo-700',
      'Extinguisher Specialist L3': 'bg-green-100 text-green-700',
      'Emergency Systems L2': 'bg-pink-100 text-pink-700',
      'Industrial Safety L3': 'bg-gray-100 text-gray-700',
      'Prevention Specialist L2': 'bg-teal-100 text-teal-700',
      'Chief Inspector L4': 'bg-violet-100 text-violet-700'
    };
    return colors[certification] || 'bg-gray-100 text-gray-700';
  }
}
