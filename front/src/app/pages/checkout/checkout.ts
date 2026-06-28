import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

/** Legacy route — redirects to place-order. */
@Component({
  selector: 'app-checkout',
  standalone: true,
  template: '',
})
export class Checkout implements OnInit {
  private router = inject(Router);

  ngOnInit() {
    this.router.navigateByUrl('/place-order');
  }
}
