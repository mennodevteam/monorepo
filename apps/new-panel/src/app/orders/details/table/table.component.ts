import { Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order } from '@menno/types';
import { MatTableModule } from '@angular/material/table';
import { SHARED } from '../../../shared';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { OrdersService } from '../../order.service';
import { DialogService } from '../../../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-order-item-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, SHARED],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
})
export class OrderItemTableComponent {
  order = input<Order>();
  showCost = input<boolean>(false);
  private dialog = inject(DialogService);
  private translate = inject(TranslateService);
  displayedColumns = computed(() => {
    if (this.isSmallScreen()) return ['title', 'quantity', 'price'];
    return this.showCost()
      ? ['index', 'title', 'quantity', 'price', 'materialCost', 'total']
      : ['index', 'title', 'quantity', 'price', 'total'];
  });
  items = computed(() => {
    return this.order()?.items || [];
    // return order ? Order.productItems(order) : [];
  });

  private readonly breakpointObserver = inject(BreakpointObserver);
  isSmallScreen = signal(false);
  orderService = inject(OrdersService);

  constructor() {
    this.breakpointObserver.observe([Breakpoints.XSmall]).subscribe((result) => {
      this.isSmallScreen.set(result.matches);
    });
  }

  setMaterialCost(itemId: string) {
    this.dialog
      .prompt(this.translate.instant('order.materialCost'), {
        value: {
          label: this.translate.instant('order.materialCost'),
          control: new FormControl(0),
          type: 'number',
          eng: true,
          ltr: true,
          hint: this.translate.instant('app.currency'),
        },
      })
      .then((result) => {
        if (result) {
          this.orderService.setOrderItemMaterialCostMutation.mutate({
            orderId: this.order()!.id,
            itemId,
            materialCost: result.value,
          });
        }
      });
  }
}
