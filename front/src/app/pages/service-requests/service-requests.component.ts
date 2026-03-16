
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface ExtinguisherData {
  id: string;
  location: string;
  type: string;
  capacity: string;
  issue: string;
}

@Component({
  selector: 'app-service-requests',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './service-requests.component.html',
  styleUrls: ['./service-requests.component.css']
})
export class ServiceRequestsComponent {
  showModal = false;
  selectedExtinguisher: ExtinguisherData | null = null;

  serviceTypes = [
    { value: 'refill', label: 'Refill' },
    { value: 'replacement', label: 'Replacement' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'repair', label: 'Repair' },
    { value: 'hydrostatic_test', label: 'Hydrostatic Test' }
  ];

  priorities = ['Low', 'Medium', 'High', 'Urgent'];

  serviceRequest = {
    extinguisherId: '',
    location: '',
    serviceType: '',
    priority: 'Urgent',
    preferredDate: '',
    additionalNotes: ''
  };

  openModal(extinguisher: ExtinguisherData) {
    this.selectedExtinguisher = extinguisher;
    this.serviceRequest.extinguisherId = extinguisher.id;
    this.serviceRequest.location = extinguisher.location;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedExtinguisher = null;
    this.resetForm();
  }

  resetForm() {
    this.serviceRequest = {
      extinguisherId: '',
      location: '',
      serviceType: '',
      priority: 'Medium',
      preferredDate: '',
      additionalNotes: ''
    };
  }

  submitRequest() {
    console.log('Service Request Submitted:', this.serviceRequest);
    // Here you would typically send the data to a backend service
    this.closeModal();
  }
}
