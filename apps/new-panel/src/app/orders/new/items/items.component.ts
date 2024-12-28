import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../../shared';
import { MatTableModule } from '@angular/material/table';
import { NewOrdersService } from '../new-order.service';

const COLS = ['index','title', 'fee', 'quantity', 'total', 'actions'];

@Component({
  selector: 'app-new-order-items',
  standalone: true,
  imports: [CommonModule, SHARED, MatTableModule],
  templateUrl: './items.component.html',
  styleUrl: './items.component.scss',
})
export class NewOrderItemsComponent {
  readonly service = inject(NewOrdersService);
  displayedColumns = COLS;
}
