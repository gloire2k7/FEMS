import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
    selector: 'app-admin-inspection-label',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './admin-inspection-label.html',
    styleUrls: ['./admin-inspection-label.css']
})
export class AdminInspectionLabel implements OnInit, AfterViewInit {
    inspectionsOpen: boolean = true;

    toggleInspections() {
        this.inspectionsOpen = !this.inspectionsOpen;
        this.initIcons();
    }
    labelId: string | null = 'LE-2023-894';
    extinguisherId: string = 'EXT-0045';

    constructor(private route: ActivatedRoute) { }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.labelId = id;
            }
        });
    }

    ngAfterViewInit() {
        this.initIcons();
    }

    private initIcons() {
        const run = () => {
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                lucide.createIcons();
            }
        };
        run();
        [100, 300, 600, 1000, 2000].forEach(delay => {
            setTimeout(run, delay);
        });
    }

    historyList = [
        {
            date: 'Oct 24, 2023',
            time: '10:42 AM',
            author: 'James A.',
            reason: 'New Inspection',
            avatar: 'https://ui-avatars.com/api/?name=James+A.&background=E2E8F0&color=475569'
        }
    ];
}
