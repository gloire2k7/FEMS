import { AfterViewInit, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar implements AfterViewInit {
  ngAfterViewInit() {
    setTimeout(() => {
      if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
    }, 50);
  }
}
