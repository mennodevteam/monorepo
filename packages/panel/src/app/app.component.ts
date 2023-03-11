import { Component } from '@angular/core';
import { RegionsService } from './core/services/regions.service';
import { TodayOrdersService } from './core/services/today-orders.service';

@Component({
  selector: 'menno-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'panel';

  constructor(private regions: RegionsService, private todayOrders: TodayOrdersService) {}
}
