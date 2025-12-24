import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopAppBarComponent } from '../../shared/components/top-app-bar/top-app-bar.component';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, TopAppBarComponent],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss',
})
export class PrivacyComponent {}

