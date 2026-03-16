import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.css'
})
export class SettingsComponent {
    inspectionInterval = 'Yearly';
    gracePeriod = 14;
    defaultLifecycle = 10;
    refillReminder = 30;

    emailAlerts = false;
    inAppPush = true;
    twoFactor = false;

    templatePreview = `Dear Admin,`;
}
