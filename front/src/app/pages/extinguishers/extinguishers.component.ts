import { AfterViewInit, Component, NgZone } from '@angular/core';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
  selector: 'app-extinguishers',
  standalone: true,
  templateUrl: './extinguishers.html',
})
export class ExtinguishersComponent implements AfterViewInit {
  constructor(private ngZone: NgZone) {}

  ngAfterViewInit() {
    const run = () => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
      }
    };
    run();
    this.ngZone.runOutsideAngular(() => {
      setTimeout(run, 0);
      setTimeout(run, 100);
      setTimeout(run, 250);
      setTimeout(run, 500);
    });
  }
}
