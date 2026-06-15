import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from '../layout/sidebar/sidebar';
import { Topbar } from '../layout/topbar/topbar';
import { AiAssistantComponent } from './shared/ai-assistant/ai-assistant.component';
import { AuthService } from './auth.service';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, Topbar, AiAssistantComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  constructor(private router: Router, private auth: AuthService) {
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(() => {
      this.runCreateIcons();
    });
  }

  showAiAssistant(): boolean {
    const path = this.router.url.split('?')[0];
    if (path === '/assistant') return false;
    return path !== '/' && path !== '/signin' && !!this.auth.getUser();
  }

  showLayout(): boolean {
    const path = this.router.url.split('?')[0];
    if (path.startsWith('/admin-') || path.startsWith('/super-admin-') || path === '/clients') return false;
    if (path === '/' || path === '/signin' || path === '/signup' || path === '/assistant') return false;
    return true;
  }

  private runCreateIcons(): void {
    const run = () => lucide?.createIcons?.();
    setTimeout(run, 0);
    setTimeout(run, 150);
  }
}
