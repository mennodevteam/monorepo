import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { InitialParamsService, MenuService, ShopService } from './core';

@Component({
  standalone: true,
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'new-app';
  initialParamsService = inject(InitialParamsService);
  /** Injected at app root so shop and menu load in parallel once; pages use data when ready. */
  private _shop = inject(ShopService);
  private _menu = inject(MenuService);
}
