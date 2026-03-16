import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
    selector: 'app-super-admin-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './super-admin-dashboard.html',
    styleUrls: ['./super-admin-dashboard.css']
})
export class SuperAdminDashboard implements AfterViewInit {

    stats = [
        { label: 'Total Companies', value: '124', trend: '+12 this month', trendType: 'positive' },
        { label: 'Total Admins', value: '48', trend: 'Active Personnel', trendType: 'neutral' },
        { label: 'Total Users', value: '2,850', trend: '+5% growth', trendType: 'positive' },
        { label: 'Extinguishers', value: '15,420', trend: 'Across all sites', trendType: 'neutral' },
        { label: 'Inspections', value: '892', trend: 'Completed this month', trendType: 'neutral' },
        { label: 'Compliance Rate', value: '94.2%', trend: 'System Healthy', trendType: 'healthy' }
    ];

    criticalIssues = [
        {
            title: 'Expired Extinguishers Detected',
            subtitle: '245 units have passed their expiry date across 12 companies.',
            type: 'error',
            icon: 'alert-circle',
            actionName: 'View List'
        },
        {
            title: 'Low Compliance Companies',
            subtitle: '3 Companies are below 80% inspection compliance threshold.',
            type: 'warning',
            icon: 'trending-down',
            actionName: 'Review'
        },
        {
            title: 'Overdue Inspections',
            subtitle: '56 Inspections were scheduled for last week but not logged.',
            type: 'neutral',
            icon: 'clock',
            actionName: 'Notify Admins'
        }
    ];

    chartData = [
        { month: 'Aug', value: 42 },
        { month: 'Sep', value: 58 },
        { month: 'Oct', value: 48 },
        { month: 'Nov', value: 72 },
        { month: 'Dec', value: 88 },
        { month: 'Jan', value: 65 }
    ];

    distribution = [
        { label: 'Passed (Healthy)', percentage: 65, color: 'bg-emerald-500' },
        { label: 'Requires Refill', percentage: 20, color: 'bg-[#0B1437]' },
        { label: 'Condemned', percentage: 10, color: 'bg-amber-400' },
        { label: 'Failed / Error', percentage: 5, color: 'bg-red-500' }
    ];

    ngAfterViewInit() {
        this.initIcons();
    }

    private initIcons() {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
            setTimeout(() => lucide.createIcons(), 100);
            setTimeout(() => lucide.createIcons(), 500);
        }
    }
}
