import { Component, input, output } from '@angular/core';
import { DeliveryArea, Status } from '@menno/types';
import { SHARED } from '../../../shared';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-delivery-area-list',
  standalone: true,
  imports: [
    SHARED,
    MatListModule,
    MatMenuModule,
    MatChipsModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './delivery-area-list.component.html',
  styleUrl: './delivery-area-list.component.scss',
})
export class DeliveryAreaListComponent {
  readonly Status = Status;
  
  deliveryAreas = input<DeliveryArea[]>([]);
  loading = input<boolean>(false);
  isEmpty = input<boolean>(false);

  editArea = output<DeliveryArea>();
  deleteArea = output<DeliveryArea>();
  addNewArea = output<void>();

  onEditArea(area: DeliveryArea) {
    this.editArea.emit(area);
  }

  onDeleteArea(area: DeliveryArea) {
    this.deleteArea.emit(area);
  }

  onAddNewArea() {
    this.addNewArea.emit();
  }
} 