import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMMON } from '../../common';
import { MatProgressBar } from '@angular/material/progress-bar';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-thanks',
  standalone: true,
  imports: [CommonModule, COMMON, MatProgressBar],
  templateUrl: './thanks.component.html',
  styleUrl: './thanks.component.scss',
})
export class ThanksComponent implements OnDestroy {
  value = signal(0);
  interval: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {
    const params = this.route.snapshot.params;
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
