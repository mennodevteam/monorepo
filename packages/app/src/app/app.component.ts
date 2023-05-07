import { Component } from '@angular/core';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'menno-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'app';
  constructor(private themeService: ThemeService, private auth: AuthService) {}

  get themeColor() {
    return this.themeService.color;
  }

  get themeMode() {
    return this.themeService.mode;
  }
}
