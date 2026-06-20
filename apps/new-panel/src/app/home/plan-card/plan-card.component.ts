import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-plan-card',
  standalone: true,
  imports: [CommonModule, SHARED, MatCardModule],
  templateUrl: './plan-card.component.html',
  styleUrl: './plan-card.component.scss',
})
export class PlanCardComponent {}
