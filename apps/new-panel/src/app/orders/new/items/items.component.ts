import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../../shared';
import { MatTableModule } from '@angular/material/table';
import { NewOrdersService } from '../new-order.service';
import { TranslateService } from '@ngx-translate/core';

const COLS = ['index', 'title', 'quantity', 'fee', 'total', 'actions'];

@Component({
  selector: 'app-new-order-items',
  standalone: true,
  imports: [CommonModule, SHARED, MatTableModule],
  templateUrl: './items.component.html',
  styleUrl: './items.component.scss',
})
export class NewOrderItemsComponent {
  readonly service = inject(NewOrdersService);
  readonly t = inject(TranslateService);
  displayedColumns = COLS;
  items = computed(() => {
    if (this.service.productItems().length) {
      return [
        ...this.service.productItems(),
        ...this.service.abstractItems(),
        {
          title: this.t.instant('app.total'),
          isAbstract: true,
          quantity: 1,
          price: this.service.totalPrice(),
        },
      ];
    }
    return [];
  });
}
