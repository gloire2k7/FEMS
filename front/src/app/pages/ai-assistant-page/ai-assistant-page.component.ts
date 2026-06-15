import { Component } from '@angular/core';
import { AiAssistantComponent } from '../../shared/ai-assistant/ai-assistant.component';

@Component({
  selector: 'app-ai-assistant-page',
  standalone: true,
  imports: [AiAssistantComponent],
  template: `
    <div class="min-h-screen bg-[#F6F8FC] font-['Poppins'] px-4 py-8 md:px-8">
      <div class="max-w-3xl mx-auto mb-6 text-center">
        <p class="text-sm font-semibold text-violet-600 uppercase tracking-wider mb-2">AI Help</p>
        <h1 class="text-2xl md:text-3xl font-bold text-[#0B1437]">FEMS Assistant</h1>
        <p class="text-slate-500 mt-2 text-base">Get instant answers about orders, inventory, clients, and navigation.</p>
      </div>
      <app-ai-assistant [fullPage]="true" />
    </div>
  `,
})
export class AiAssistantPageComponent {}
