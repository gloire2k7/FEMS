import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth.service';
import { AiService } from '../../services/ai.service';

declare const lucide: { createIcons: () => void } | undefined;

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  suggestions?: string[];
  action?: { route: string; label: string; query?: Record<string, string> };
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ai-assistant.component.html',
  styleUrl: './ai-assistant.component.css',
})
export class AiAssistantComponent implements AfterViewInit {
  private auth = inject(AuthService);
  private ai = inject(AiService);
  private router = inject(Router);

  /** When true, renders as a full page instead of a floating widget */
  @Input() fullPage = false;

  @ViewChild('scrollArea') scrollArea?: ElementRef<HTMLElement>;

  open = false;
  expanded = false;
  input = '';
  loading = false;
  messages: ChatMessage[] = [];

  ngAfterViewInit() {
    if (this.fullPage) {
      this.open = true;
      this.seedWelcome();
    }
    this.refreshIcons();
  }

  toggle() {
    this.open = !this.open;
    if (this.open && !this.messages.length) this.seedWelcome();
    this.refreshIcons();
  }

  close() {
    if (this.fullPage) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.open = false;
    this.expanded = false;
  }

  toggleExpand() {
    this.expanded = !this.expanded;
    this.refreshIcons();
  }

  openFullPage() {
    this.router.navigate(['/assistant']);
    this.open = false;
  }

  send(text?: string) {
    const q = (text ?? this.input).trim();
    if (!q || this.loading) return;
    this.messages.push({ role: 'user', text: q });
    this.input = '';
    this.loading = true;
    this.scrollToBottom();

    this.ai.chat(q).subscribe({
      next: (res) => {
        this.messages.push({
          role: 'bot',
          text: res.reply,
          suggestions: res.suggestions,
          action: res.action,
        });
        this.loading = false;
        this.scrollToBottom();
        this.refreshIcons();
      },
      error: () => {
        this.messages.push({ role: 'bot', text: this.fallbackAnswer(q), suggestions: this.defaultSuggestions() });
        this.loading = false;
        this.scrollToBottom();
      },
    });
  }

  useSuggestion(text: string) {
    this.send(text);
  }

  runAction(action: { route: string; label: string; query?: Record<string, string> }) {
    if (action.route === '__download__') {
      window.open(action.query?.['url'], '_blank');
      return;
    }
    this.router.navigate([action.route], { queryParams: action.query ?? {} });
    if (!this.fullPage) this.open = false;
  }

  formatText(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  userInitials(): string {
    const name = this.auth.getUser()?.name ?? 'U';
    return name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  }

  roleLabel(): string {
    return this.auth.getUser()?.role_name || this.auth.getUser()?.role || 'User';
  }

  private seedWelcome() {
    const first = (this.auth.getUser()?.name ?? 'there').split(' ')[0];
    this.messages = [{
      role: 'bot',
      text: `Hi **${first}**! I'm your FEMS assistant. Ask me about orders, inventory, clients, or navigation — I'll guide you based on your **${this.roleLabel()}** access.`,
      suggestions: this.defaultSuggestions(),
    }];
  }

  private defaultSuggestions(): string[] {
    const role = this.auth.getUser()?.role ?? '';
    if (role === 'Super Admin') return ['Show stats', 'Approve clients', 'Add admin', 'Generate report'];
    if (role === 'Admin') return ['Show stats', 'Approve orders', 'Check inventory', 'Pending clients'];
    return ['Show stats', 'How do I order?', 'Track my orders', 'My extinguishers'];
  }

  private fallbackAnswer(q: string): string {
    const lower = q.toLowerCase();
    if (lower.includes('order')) return 'Orders can be placed from the Shop (clients) or reviewed under Admin Orders (admins).';
    if (lower.includes('stock') || lower.includes('inventory')) return 'Warehouse stock is managed under Admin Inventory.';
    return 'I can help with orders, stock, clients, and navigation. Try "Show stats" or ask a specific question.';
  }

  private scrollToBottom() {
    setTimeout(() => {
      const el = this.scrollArea?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }

  private refreshIcons() {
    setTimeout(() => lucide?.createIcons?.(), 0);
    setTimeout(() => lucide?.createIcons?.(), 120);
  }
}
