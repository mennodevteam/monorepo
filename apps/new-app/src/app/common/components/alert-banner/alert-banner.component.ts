import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMMON } from '../..';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-alert-banner',
  standalone: true,
  imports: [CommonModule, COMMON, MatCardModule],
  templateUrl: './alert-banner.component.html',
  styleUrl: './alert-banner.component.scss',
})
export class AlertBannerComponent {
  @Input() type?: 'info' | 'error' | 'warning';
  @Input() title: string;
  @Input() description: string;
}
