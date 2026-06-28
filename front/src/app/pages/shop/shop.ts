import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

/** Legacy route — redirects to place-order. */
@Component({
  selector: 'app-shop',
  standalone: true,
  template: '',
})
export class Shop implements OnInit {
  private router = inject(Router);

  ngOnInit() {
    this.router.navigateByUrl('/place-order');
  }
}
