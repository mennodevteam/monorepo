import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { ShopTheme, ThemeMode, ThemeService } from '../../../core/services/theme.service';

@Component({
  standalone: true,
  selector: 'app-theme-demo',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
  ],
  templateUrl: './theme-demo.component.html',
  styleUrls: ['./theme-demo.component.scss'],
})
export class ThemeDemoComponent {
  mode: ThemeMode = 'light';
  mainColor = '#000000';

  private readonly themeService = inject(ThemeService);

  apply(): void {
    const payload: ShopTheme = {
      mode: this.mode,
      mainColor: this.mainColor,
    };
    this.themeService.setTheme(payload);
  }
}

