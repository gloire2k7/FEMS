import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
    selector: 'app-admin-settings',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './admin-settings.html',
    styleUrls: ['./admin-settings.css']
})
export class AdminSettings implements AfterViewInit {
    inspectionsOpen: boolean = false;

    // Settings State
    inspectionInterval: number = 12;
    gracePeriod: number = 14;
    lifecycleYears: number = 10;
    refillReminder: number = 30;
    emailAlerts: boolean = false;
    inAppPush: boolean = true;
    twoFactorAuth: boolean = false;

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

    toggleInspections() {
        this.inspectionsOpen = !this.inspectionsOpen;
        setTimeout(() => this.initIcons(), 0);
    }
}
