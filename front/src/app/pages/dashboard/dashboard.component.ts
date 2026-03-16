import { AfterViewInit, Component } from '@angular/core';

import { RouterModule } from '@angular/router';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements AfterViewInit {
  ngAfterViewInit() {
    // Run after view is in DOM; repeat once after a tick so Angular CD doesn't overwrite SVGs
    const run = () => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    };
    run();
    setTimeout(run, 0);
    setTimeout(run, 150);
  }
}
