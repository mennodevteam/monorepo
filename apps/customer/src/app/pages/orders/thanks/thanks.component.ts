import { Component, inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-thanks',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule],
  templateUrl: './thanks.component.html',
  styleUrl: './thanks.component.scss',
})
export class ThanksComponent implements OnDestroy {
  private readonly cart = inject(CartService);
  value = signal(0);
  interval: any;
  id?: string;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.cart.clear();
    const params = this.route.snapshot.params;
    this.id = params['id'];
    this.interval = setInterval(() => {
      if (this.value() < 100) this.value.update((prev) => prev + 1);
      else {
        setTimeout(() => {
          this.router.navigate([`/orders/${params['id']}`], { replaceUrl: true });
        }, 1000);
      }
    }, 50);
  }

  ngOnDestroy(): void {
    if (this.interval) clearInterval(this.interval);
  }
}

