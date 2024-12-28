import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewOrdersService } from './new-order.service';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { NewOrderItemsComponent } from "./items/items.component";

@Component({
  selector: 'app-new',
  standalone: true,
  imports: [CommonModule, SHARED, MatToolbarModule, MatCardModule, NewOrderItemsComponent],
  providers: [NewOrdersService],
  templateUrl: './new.component.html',
  styleUrl: './new.component.scss',
})
export class NewOrderComponent {
  readonly service = inject(NewOrdersService);
}
