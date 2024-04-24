import { Component } from '@angular/core';
import { RegionsService } from './core/services/regions.service';
import { TodayOrdersService } from './core/services/today-orders.service';
import { AuthService } from './core/services/auth.service';
import { MatomoService } from './core/services/matomo.service';

@Component({
  selector: 'menno-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'panel';

  constructor(
    private auth: AuthService,
    private matomo: MatomoService,
  ) {}
}
