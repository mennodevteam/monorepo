import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'order-complete',
  templateUrl: './order-complete.component.html',
  styleUrls: ['./order-complete.component.scss'],
})
export class OrderCompleteComponent implements OnDestroy {
  timer = 6;
  interval: any;
  constructor(private route: ActivatedRoute, private router: Router) {
    this.interval = setInterval(() => {
      if (this.timer > 0) {
        this.timer--;
      } else {
        this.goToOrderPage();
      }
    }, 1000);
  }
  get orderId() {
    return this.route.snapshot.params['orderId'];
  }

  goToOrderPage() {
    this.router.navigate([`/orders/details`, this.orderId], {
      replaceUrl: true,
    });
  }

  ngOnDestroy(): void {
    try {
      clearInterval(this.interval);
    } catch (error) {}
  }
}
