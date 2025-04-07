import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { OrderTotalComponent } from "./order-total/order-total.component";
import { MenuStatCardComponent } from "./menu-stat-card/menu-stat-card.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SHARED, OrderTotalComponent, MenuStatCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {}
