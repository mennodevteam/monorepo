import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { OrderTotalComponent } from "./order-total/order-total.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SHARED, OrderTotalComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {}
