import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersComponent } from './orders.component';
import { RouterModule } from '@angular/router';
import { ordersRoutes } from './orders.routes';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [OrdersComponent],
  imports: [CommonModule, RouterModule.forChild(ordersRoutes), SharedModule],
})
export class OrdersModule {}
