import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MenuService, ShopService } from './core';

@Component({
  standalone: true,
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'new-app';

  constructor(private shopService: ShopService, private menuService: MenuService) {}
}
