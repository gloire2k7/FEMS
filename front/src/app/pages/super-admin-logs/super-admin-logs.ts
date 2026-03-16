import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
    selector: 'app-super-admin-logs',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './super-admin-logs.html',
    styleUrls: ['./super-admin-logs.css'],
})
export class SuperAdminLogs implements AfterViewInit {
    metrics = [
        { label: 'TOTAL LOGS', value: '24,847', subValue: '+12.5% vs last month', icon: 'file-text', iconBg: 'bg-white/10', textCol: 'text-white', bgCol: 'bg-[#0B1437]' },
        { label: "TODAY'S ACTIVITY", value: '1,847', subValue: 'Last action 2 min ago', icon: 'zap', iconBg: 'bg-green-100', textCol: 'text-slate-400', bgCol: 'bg-white', statusDot: 'bg-green-500' },
        { label: 'CRITICAL ACTIONS', value: '127', subValue: '24 Deletes • 103 Updates', icon: 'alert-triangle', iconBg: 'bg-red-100', textCol: 'text-slate-400', bgCol: 'bg-white' },
        { label: 'ACTIVE USERS', value: '89', subValue: '81 online now', icon: 'users', iconBg: 'bg-blue-100', textCol: 'text-slate-400', bgCol: 'bg-white', statusDot: 'bg-blue-500' }
    ];

    heatmap = [
        { label: 'Client', value: '12,547 actions', percent: 85, color: 'bg-blue-600' },
        { label: 'Extinguisher', value: '8,423 actions', percent: 65, color: 'bg-blue-400' },
        { label: 'Inspection', value: '6,234 actions', percent: 50, color: 'bg-emerald-500' },
        { label: 'Label', value: '4,128 actions', percent: 35, color: 'bg-purple-500' },
        { label: 'User', value: '3,211 actions', percent: 25, color: 'bg-orange-500' }
    ];

    actionTypes = [
        { label: 'Login', value: '8,234', color: 'bg-blue-900' },
        { label: 'Create', value: '5,847', color: 'bg-blue-500' },
        { label: 'Update', value: '7,523', color: 'bg-amber-500' },
        { label: 'Delete', value: '1,243', color: 'bg-red-500' },
        { label: 'Export', value: '2,900', color: 'bg-indigo-400' }
    ];

    logs = [
        { id: 'LOG-24847', name: 'Sarah Johnson', email: 'sarah.j@fems.com', role: 'Admin', action: 'Delete', entity: 'Client', date: 'Oct 31, 2023', time: '15:22:16', ip: '192.168.1.123', avatar: 'https://i.pravatar.cc/150?u=sarah', actionClass: 'bg-red-50 text-red-600 border-red-100', roleClass: 'bg-purple-50 text-purple-600' },
        { id: 'LOG-24846', name: 'Michael Brown', email: 'm.brown@fems.com', role: 'Manager', action: 'Approve', entity: 'Inspection', date: 'Oct 31, 2023', time: '14:20:45', ip: '192.168.1.87', avatar: 'https://i.pravatar.cc/150?u=michael', actionClass: 'bg-emerald-50 text-emerald-600 border-emerald-100', roleClass: 'bg-blue-50 text-blue-600' },
        { id: 'LOG-24845', name: 'John Smith', email: 'j.smith@fems.com', role: 'Inspector', action: 'Update', entity: 'Extinguisher', date: 'Oct 31, 2023', time: '14:15:22', ip: '10.0.0.45', avatar: 'https://i.pravatar.cc/150?u=john', actionClass: 'bg-amber-50 text-amber-600 border-amber-100', roleClass: 'bg-amber-50 text-amber-600' },
        { id: 'LOG-24844', name: 'Emma Wilson', email: 'e.wilson@fems.com', role: 'Login', action: 'Login', entity: 'User', date: 'Oct 31, 2023', time: '13:58:11', ip: '172.16.0.201', avatar: 'https://i.pravatar.cc/150?u=emma', actionClass: 'bg-slate-100 text-slate-600 border-slate-200', roleClass: 'bg-slate-800 text-white' },
        { id: 'LOG-24843', name: 'David Martinez', email: 'd.martinez@fems.com', role: 'Admin', action: 'Export', entity: 'Label', date: 'Oct 31, 2023', time: '13:42:37', ip: '192.168.1.123', avatar: 'https://i.pravatar.cc/150?u=david', actionClass: 'bg-indigo-50 text-indigo-600 border-indigo-100', roleClass: 'bg-purple-50 text-purple-600' },
        { id: 'LOG-24842', name: 'Lisa Andersen', email: 'l.andersen@fems.com', role: 'Manager', action: 'Create', entity: 'Client', date: 'Oct 31, 2023', time: '13:15:59', ip: '10.0.0.78', avatar: 'https://i.pravatar.cc/150?u=lisa', actionClass: 'bg-emerald-50 text-emerald-600 border-emerald-100', roleClass: 'bg-blue-50 text-blue-600' },
        { id: 'LOG-24841', name: 'Robert Taylor', email: 'r.taylor@fems.com', role: 'User', action: 'Export', entity: 'Inspection', date: 'Oct 31, 2023', time: '12:47:33', ip: '192.168.1.52', avatar: 'https://i.pravatar.cc/150?u=robert', actionClass: 'bg-indigo-50 text-indigo-600 border-indigo-100', roleClass: 'bg-slate-100 text-slate-600' },
        { id: 'LOG-24840', name: 'Jennifer Lee', email: 'j.lee@fems.com', role: 'Inspector', action: 'Update', entity: 'Extinguisher', date: 'Oct 31, 2023', time: '12:22:44', ip: '10.0.0.156', avatar: 'https://i.pravatar.cc/150?u=jennifer', actionClass: 'bg-amber-50 text-amber-600 border-amber-100', roleClass: 'bg-amber-50 text-amber-600' }
    ];

    ngAfterViewInit() {
        this.initIcons();
    }

    private initIcons() {
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
            setTimeout(() => lucide.createIcons(), 200);
        }
    }
}
