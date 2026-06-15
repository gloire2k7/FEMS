import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-between px-2 py-4" *ngIf="total > 0">
      <p class="text-sm font-medium text-slate-500">
        Page {{ page }} of {{ lastPage }} · {{ total }} total
      </p>
      <div class="flex gap-2">
        <button type="button" (click)="go(page - 1)" [disabled]="page <= 1"
          class="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-100 text-slate-600 disabled:opacity-40 hover:bg-slate-200">
          Previous
        </button>
        <button type="button" (click)="go(page + 1)" [disabled]="page >= lastPage"
          class="px-4 py-2 rounded-lg text-sm font-semibold bg-[#0B1437] text-white disabled:opacity-40 hover:bg-black">
          Next
        </button>
      </div>
    </div>
  `
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() lastPage = 1;
  @Input() total = 0;
  @Output() pageChange = new EventEmitter<number>();

  go(p: number) {
    if (p >= 1 && p <= this.lastPage) {
      this.pageChange.emit(p);
    }
  }
}
