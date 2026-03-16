import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  type: 'office' | 'warehouse' | 'retail' | 'industrial' | 'restaurant';
  totalExtinguishers: number;
  compliantExtinguishers: number;
  needsService: number;
  expired: number;
  lastInspection: string;
  manager: string;
  contact: string;
  status: 'compliant' | 'attention' | 'critical';
}

export interface Extinguisher {
  id: string;
  type: string;
  capacity: string;
  dateRefilled: string;
  status: 'Passed' | 'Almost Expired' | 'Expired';
  lastInspection: string;
  nextInspection: string;
}

@Component({
  selector: 'app-locations-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './locations-dashboard.component.html',
  styleUrls: ['./locations-dashboard.component.css']
})
export class LocationsDashboardComponent {
  searchTerm = '';
  selectedFilter = 'all';
  currentPage = 1;
  itemsPerPage = 12;

  searchExtinguisherQuery = '';
  extinguisherCurrentPage = 1;
  extinguishersPerPage = 8;

  extinguishers: Extinguisher[] = [
    { id: 'FE-MH-001', type: 'CO₂', capacity: '5kg', dateRefilled: 'Jan 15, 2024', status: 'Passed', lastInspection: 'May 10, 2024', nextInspection: 'Nov 10, 2024' },
    { id: 'FE-MH-002', type: 'Dry Powder', capacity: '6kg', dateRefilled: 'Feb 20, 2024', status: 'Passed', lastInspection: 'May 12, 2024', nextInspection: 'Nov 12, 2024' },
    { id: 'FE-MH-003', type: 'Foam', capacity: '9L', dateRefilled: 'Mar 05, 2023', status: 'Almost Expired', lastInspection: 'Dec 20, 2023', nextInspection: 'Jun 20, 2024' },
    { id: 'FE-MH-004', type: 'Dry Powder', capacity: '4kg', dateRefilled: 'Jan 28, 2024', status: 'Passed', lastInspection: 'May 08, 2024', nextInspection: 'Nov 08, 2024' },
    { id: 'FE-MH-005', type: 'CO₂', capacity: '5kg', dateRefilled: 'Aug 10, 2022', status: 'Expired', lastInspection: 'Feb 15, 2023', nextInspection: 'May 01, 2024' },
    { id: 'FE-MH-006', type: 'Water', capacity: '9L', dateRefilled: 'Apr 12, 2023', status: 'Almost Expired', lastInspection: 'Jan 10, 2024', nextInspection: 'Jul 10, 2024' },
    { id: 'FE-MH-007', type: 'Dry Powder', capacity: '6kg', dateRefilled: 'Feb 18, 2024', status: 'Passed', lastInspection: 'May 15, 2024', nextInspection: 'Nov 15, 2024' },
    { id: 'FE-MH-008', type: 'Foam', capacity: '6L', dateRefilled: 'Sep 20, 2022', status: 'Expired', lastInspection: 'Mar 15, 2023', nextInspection: 'Apr 28, 2024' },
    // Mocking the remaining 16 items to total 24 to match the paginator count EXACTLY.
    ...Array(16).fill(null).map((_, i) => ({
      id: `FE-MH-00${i + 9 < 10 ? '0' : ''}${i + 9}`,
      type: 'Dry Powder', capacity: '4kg', dateRefilled: 'Jan 20, 2024', status: 'Passed', lastInspection: 'May 05, 2024', nextInspection: 'Nov 05, 2024'
    } as Extinguisher))
  ];

  locations: Location[] = [
    {
      id: '1',
      name: 'Downtown Office',
      address: '123 Main Street',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      type: 'office',
      totalExtinguishers: 24,
      compliantExtinguishers: 22,
      needsService: 2,
      expired: 0,
      lastInspection: '2024-01-15',
      manager: 'John Smith',
      contact: 'john.smith@company.com',
      status: 'compliant'
    },
    {
      id: '2',
      name: 'Warehouse District',
      address: '456 Industrial Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      type: 'warehouse',
      totalExtinguishers: 48,
      compliantExtinguishers: 35,
      needsService: 8,
      expired: 5,
      lastInspection: '2024-01-10',
      manager: 'Sarah Johnson',
      contact: 'sarah.j@company.com',
      status: 'critical'
    },
    {
      id: '3',
      name: 'Retail Store - Mall',
      address: '789 Shopping Center',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      type: 'retail',
      totalExtinguishers: 12,
      compliantExtinguishers: 10,
      needsService: 2,
      expired: 0,
      lastInspection: '2024-01-12',
      manager: 'Mike Davis',
      contact: 'mike.d@company.com',
      status: 'attention'
    },
    {
      id: '4',
      name: 'Industrial Plant',
      address: '321 Factory Road',
      city: 'Houston',
      state: 'TX',
      zipCode: '77001',
      type: 'industrial',
      totalExtinguishers: 64,
      compliantExtinguishers: 60,
      needsService: 4,
      expired: 0,
      lastInspection: '2024-01-08',
      manager: 'Robert Wilson',
      contact: 'robert.w@company.com',
      status: 'compliant'
    },
    {
      id: '5',
      name: 'Restaurant Chain - Unit 1',
      address: '555 Food Court',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001',
      type: 'restaurant',
      totalExtinguishers: 8,
      compliantExtinguishers: 6,
      needsService: 2,
      expired: 0,
      lastInspection: '2024-01-14',
      manager: 'Lisa Chen',
      contact: 'lisa.c@company.com',
      status: 'attention'
    },
    {
      id: '6',
      name: 'Corporate Headquarters',
      address: '999 Business Park',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94101',
      type: 'office',
      totalExtinguishers: 36,
      compliantExtinguishers: 36,
      needsService: 0,
      expired: 0,
      lastInspection: '2024-01-16',
      manager: 'David Brown',
      contact: 'david.b@company.com',
      status: 'compliant'
    },
    {
      id: '7',
      name: 'Distribution Center',
      address: '777 Logistics Way',
      city: 'Dallas',
      state: 'TX',
      zipCode: '75201',
      type: 'warehouse',
      totalExtinguishers: 52,
      compliantExtinguishers: 45,
      needsService: 5,
      expired: 2,
      lastInspection: '2024-01-09',
      manager: 'Jennifer Lee',
      contact: 'jennifer.l@company.com',
      status: 'attention'
    },
    {
      id: '8',
      name: 'Tech Campus',
      address: '444 Innovation Drive',
      city: 'Seattle',
      state: 'WA',
      zipCode: '98101',
      type: 'office',
      totalExtinguishers: 28,
      compliantExtinguishers: 26,
      needsService: 2,
      expired: 0,
      lastInspection: '2024-01-13',
      manager: 'Tom Martinez',
      contact: 'tom.m@company.com',
      status: 'compliant'
    },
    {
      id: '9',
      name: 'Manufacturing Facility',
      address: '222 Production Lane',
      city: 'Detroit',
      state: 'MI',
      zipCode: '48201',
      type: 'industrial',
      totalExtinguishers: 72,
      compliantExtinguishers: 58,
      needsService: 10,
      expired: 4,
      lastInspection: '2024-01-07',
      manager: 'Carlos Rodriguez',
      contact: 'carlos.r@company.com',
      status: 'critical'
    },
    {
      id: '10',
      name: 'Shopping Complex',
      address: '888 Retail Boulevard',
      city: 'Miami',
      state: 'FL',
      zipCode: '33101',
      type: 'retail',
      totalExtinguishers: 32,
      compliantExtinguishers: 30,
      needsService: 2,
      expired: 0,
      lastInspection: '2024-01-11',
      manager: 'Amanda White',
      contact: 'amanda.w@company.com',
      status: 'compliant'
    },
    {
      id: '11',
      name: 'Fine Dining Restaurant',
      address: '111 Gourmet Street',
      city: 'Boston',
      state: 'MA',
      zipCode: '02101',
      type: 'restaurant',
      totalExtinguishers: 6,
      compliantExtinguishers: 4,
      needsService: 2,
      expired: 0,
      lastInspection: '2024-01-15',
      manager: 'Patrick O\'Brien',
      contact: 'patrick.o@company.com',
      status: 'attention'
    },
    {
      id: '12',
      name: 'Research Laboratory',
      address: '333 Science Park',
      city: 'Denver',
      state: 'CO',
      zipCode: '80201',
      type: 'industrial',
      totalExtinguishers: 20,
      compliantExtinguishers: 18,
      needsService: 2,
      expired: 0,
      lastInspection: '2024-01-14',
      manager: 'Dr. Emily Zhang',
      contact: 'emily.z@company.com',
      status: 'compliant'
    }
  ];

  filterOptions = [
    { value: 'all', label: 'All Locations' },
    { value: 'compliant', label: 'Compliant' },
    { value: 'attention', label: 'Needs Attention' },
    { value: 'critical', label: 'Critical' },
    { value: 'office', label: 'Office' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'retail', label: 'Retail' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'restaurant', label: 'Restaurant' }
  ];

  get filteredLocations() {
    let filtered = this.locations;

    // Apply search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(location =>
        location.name.toLowerCase().includes(searchLower) ||
        location.address.toLowerCase().includes(searchLower) ||
        location.city.toLowerCase().includes(searchLower) ||
        location.manager.toLowerCase().includes(searchLower)
      );
    }

    // Apply status/type filter
    if (this.selectedFilter !== 'all') {
      if (['compliant', 'attention', 'critical'].includes(this.selectedFilter)) {
        filtered = filtered.filter(location => location.status === this.selectedFilter);
      } else {
        filtered = filtered.filter(location => location.type === this.selectedFilter);
      }
    }

    return filtered;
  }

  get paginatedLocations() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredLocations.slice(start, end);
  }

  get totalPages() {
    return Math.ceil(this.filteredLocations.length / this.itemsPerPage);
  }

  get totalLocations() {
    return this.locations.length;
  }

  get compliantLocations() {
    return this.locations.filter(l => l.status === 'compliant').length;
  }

  get attentionLocations() {
    return this.locations.filter(l => l.status === 'attention').length;
  }

  get criticalLocations() {
    return this.locations.filter(l => l.status === 'critical').length;
  }

  getStatusColor(status: string) {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'attention':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }

  getTypeIcon(type: string) {
    switch (type) {
      case 'office':
        return 'building';
      case 'warehouse':
        return 'package';
      case 'retail':
        return 'shopping-cart';
      case 'industrial':
        return 'factory';
      case 'restaurant':
        return 'utensils';
      default:
        return 'map-pin';
    }
  }

  getTypeColor(type: string) {
    switch (type) {
      case 'office':
        return 'bg-blue-100 text-blue-700';
      case 'warehouse':
        return 'bg-purple-100 text-purple-700';
      case 'retail':
        return 'bg-pink-100 text-pink-700';
      case 'industrial':
        return 'bg-gray-100 text-gray-700';
      case 'restaurant':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  getCompliancePercentage(location: Location) {
    return Math.round((location.compliantExtinguishers / location.totalExtinguishers) * 100);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  selectLocation(location: Location) {
    console.log('Selected location:', location.name);
    // Here you could navigate to a location details page or open a modal
  }

  get filteredExtinguishers() {
    let filtered = this.extinguishers;
    if (this.searchExtinguisherQuery) {
      filtered = filtered.filter(e => e.id.toLowerCase().includes(this.searchExtinguisherQuery.toLowerCase()));
    }
    return filtered;
  }

  get paginatedExtinguishers() {
    const start = (this.extinguisherCurrentPage - 1) * this.extinguishersPerPage;
    return this.filteredExtinguishers.slice(start, start + this.extinguishersPerPage);
  }

  get totalExtinguisherPages() {
    return Math.ceil(this.filteredExtinguishers.length / this.extinguishersPerPage);
  }

  changeExtinguisherPage(page: number) {
    if (page >= 1 && page <= this.totalExtinguisherPages) {
      this.extinguisherCurrentPage = page;
    }
  }

  getExtinguisherStatusClass(status: string) {
    switch (status) {
      case 'Passed':
        return 'bg-[#D1FAE5] text-[#059669]';
      case 'Almost Expired':
        return 'bg-[#FFEDD5] text-[#D97706]';
      case 'Expired':
        return 'bg-[#FFE4E6] text-[#E11D48]';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  getNextInspectionClass(status: string) {
    switch (status) {
      case 'Almost Expired':
        return 'text-[#EA580C] font-extrabold';
      case 'Expired':
        return 'text-[#DC2626] font-extrabold';
      default:
        return 'text-slate-500 font-semibold';
    }
  }
}
