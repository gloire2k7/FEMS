import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './notifications.component.html',
    styleUrl: './notifications.component.css'
})
export class NotificationsComponent {
    notifications = [
        {
            id: 1,
            type: 'warning',
            title: 'Maintenance Due',
            message: 'Extinguisher FE-MH-003 is due for a refill in 5 days.',
            time: '2 hours ago',
            read: false,
            icon: 'alert-triangle',
            iconClass: 'bg-amber-50 text-amber-500'
        },
        {
            id: 2,
            type: 'critical',
            title: 'Urgent Action Required',
            message: 'FE-MH-005 in Warehouse B has EXPIRED. Please replace immediately.',
            time: '5 hours ago',
            read: false,
            icon: 'alert-octagon',
            iconClass: 'bg-red-50 text-red-500'
        },
        {
            id: 3,
            type: 'info',
            title: 'Inspection Completed',
            message: 'Main Hall quarterly inspection was completed by John Doe.',
            time: 'Yesterday',
            read: true,
            icon: 'check-circle',
            iconClass: 'bg-emerald-50 text-emerald-500'
        },
        {
            id: 4,
            type: 'system',
            title: 'New Inspector Assigned',
            message: 'Sarah Chen has been assigned to your region.',
            time: '2 days ago',
            read: true,
            icon: 'user-plus',
            iconClass: 'bg-indigo-50 text-indigo-500'
        }
    ];

    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
    }
}
