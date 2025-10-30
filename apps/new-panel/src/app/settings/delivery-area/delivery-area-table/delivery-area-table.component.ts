import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { DeliveryArea, Status } from '@menno/types';
import { TranslateModule } from '@ngx-translate/core';
import { SHARED } from '../../../shared';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';

@Component({
  selector: 'app-delivery-area-table',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    TranslateModule,
    SHARED,
    StatusChipComponent,
  ],
  templateUrl: './delivery-area-table.component.html',
  styleUrls: ['./delivery-area-table.component.scss'],
})
export class DeliveryAreaTableComponent {
  @Input() deliveryAreas: DeliveryArea[] = [];
  @Output() editArea = new EventEmitter<DeliveryArea>();
  @Output() deleteArea = new EventEmitter<DeliveryArea>();
  @Output() addNewArea = new EventEmitter<void>();
  @Output() changeStatus = new EventEmitter<{ id: string; status: Status }>();

  displayedColumns: string[] = [
    'title',
    'price',
    'percentagePrice',
    'minOrderPrice',
    'minPriceForFree',
    'status',
    'actions',
  ];
  readonly Status = Status;

  onEdit(area: DeliveryArea) {
    this.editArea.emit(area);
  }

  onDelete(area: DeliveryArea) {
    this.deleteArea.emit(area);
  }

  onStatusChange(area: DeliveryArea, status: Status) {
    this.changeStatus.emit({ id: area.id, status });
  }

  onAddNewArea() {
    this.addNewArea.emit();
  }
}
