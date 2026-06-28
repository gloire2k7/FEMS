import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AiAssistantComponent } from './shared/ai-assistant/ai-assistant.component';
import { AuthService } from './auth.service';

declare const lucide: { createIcons: (opts?: { nameAttr?: string }) => void } | undefined;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AiAssistantComponent],
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
    if (!this.auth.getUser()) return false;
    return this.auth.hasPermission('ai_assistant.use');
  }

  private runCreateIcons(): void {
    const run = () => lucide?.createIcons?.();
    setTimeout(run, 0);
    setTimeout(run, 150);
  }
}
