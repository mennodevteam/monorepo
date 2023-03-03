import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderListComponent } from './order-list/order-list.component';
import { OrderCardComponent } from './order-list/order-card/order-card.component';
import { RouterModule } from '@angular/router';
import { OrdersRoutes } from './orders.routes';
import { MatCardModule } from '@angular/material/card';
import { SharedModule } from '../../shared/shared.module';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [OrderListComponent, OrderCardComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(OrdersRoutes),
    SharedModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatToolbarModule,
    MatButtonModule,
  ],
})
export class OrdersModule {}
