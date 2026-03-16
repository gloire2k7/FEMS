import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ClientSummary {
  initials: string;
  name: string;
  location: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  locationsCount: number;
  extinguishersCount: number;
}

@Component({
  selector: 'app-client-clients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './client-clients.html',
  styleUrl: './client-clients.css',
})
export class ClientClientsComponent {
  searchTerm = '';

  clients: ClientSummary[] = [
    {
      initials: 'TC',
      name: 'TechCorp Industries',
      location: 'New York, USA',
      email: 'admin@techcorp.com',
      phone: '+1 (555) 0123-4567',
      status: 'Active',
      locationsCount: 3,
      extinguishersCount: 84,
    },
    {
      initials: 'GL',
      name: 'Global Logistics',
      location: 'London, UK',
      email: 'safety@global-log.co.uk',
      phone: '+44 20 7123 4567',
      status: 'Active',
      locationsCount: 5,
      extinguishersCount: 156,
    },
    {
      initials: 'SW',
      name: 'Star Warehouse',
      location: 'Berlin, Germany',
      email: 'contact@star-ware.de',
      phone: '+49 30 123456',
      status: 'Inactive',
      locationsCount: 2,
      extinguishersCount: 36,
    },
    {
      initials: 'RCA',
      name: 'Rwanda Coding Academy',
      location: 'Nyabihu, Rwanda',
      email: 'safety@rca.rw',
      phone: '+250 788 000 111',
      status: 'Active',
      locationsCount: 1,
      extinguishersCount: 24,
    },
  ];

  get filteredClients(): ClientSummary[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.clients;
    return this.clients.filter((c) => {
      return (
        c.name.toLowerCase().includes(term) ||
        c.location.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.phone.toLowerCase().includes(term)
      );
    });
  }

  get activeClientsCount(): number {
    return this.clients.filter((c) => c.status === 'Active').length;
  }

  get inactiveClientsCount(): number {
    return this.clients.filter((c) => c.status === 'Inactive').length;
  }
}

