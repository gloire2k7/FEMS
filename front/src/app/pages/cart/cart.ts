import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

/** Legacy route — redirects to place-order. */
@Component({
  selector: 'app-cart',
  standalone: true,
  template: '',
})
export class Cart implements OnInit {
  private router = inject(Router);

  ngOnInit() {
    this.router.navigateByUrl('/place-order');
  }
}
