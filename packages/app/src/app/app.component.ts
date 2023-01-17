import { Component } from '@angular/core';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'menno-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'app';
  constructor(private themeService: ThemeService) {}

  get themeColor() {
    return this.themeService.color;
  }

  get themeMode() {
    return this.themeService.mode;
  }
}
