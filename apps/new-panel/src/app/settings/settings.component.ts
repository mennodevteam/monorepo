import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { SHARED } from '../shared';
import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, MatListModule, MatCardModule, SHARED, MatSidenavModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {}
