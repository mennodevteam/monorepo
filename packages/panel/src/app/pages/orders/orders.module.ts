import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersComponent } from './orders.component';
import { RouterModule } from '@angular/router';
import { ordersRoutes } from './orders.routes';
import { SharedModule } from '../../shared/shared.module';
import { OrderDetailsComponent } from './order-details/order-details.component';
import { OrderReportsComponent } from './order-reports/order-reports.component';
import { NgChartsModule } from 'ng2-charts';
import { OrderTypePipe } from '../../shared/pipes/order-type.pipe';
import { OrderStatePipe } from '../../shared/pipes/order-state.pipe';
import { OrderPaymentPipe } from '../../shared/pipes/order-payment.pipe';
import { MenuCurrencyPipe } from '../../shared/pipes/menu-currency.pipe';

@NgModule({
  declarations: [OrdersComponent, OrderDetailsComponent, OrderReportsComponent],
  imports: [CommonModule, RouterModule.forChild(ordersRoutes), SharedModule, NgChartsModule],
  providers: [OrderTypePipe, OrderStatePipe, OrderPaymentPipe, MenuCurrencyPipe],
})
export class OrdersModule {}
