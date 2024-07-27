import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopAppBarComponent } from '../common/components/top-app-bar/top-app-bar.component';
import { COMMON } from '../common';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../core';

@Component({
  selector: 'app-main-menu',
  standalone: true,
  imports: [CommonModule, TopAppBarComponent, COMMON, MatListModule],
  templateUrl: './main-menu.component.html',
  styleUrl: './main-menu.component.scss',
})
export class MainMenuComponent {
  constructor(public auth: AuthService) {}
}
