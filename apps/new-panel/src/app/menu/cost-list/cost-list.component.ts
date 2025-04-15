import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MenuService } from '../menu.service';
import { DialogService } from '../../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { MenuCost, Status } from '@menno/types';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MenuStatusChipComponent } from '../status-chip/status-chip.component';
import { ShopService } from '../../shop/shop.service';
import {MatSlideToggleModule} from '@angular/material/slide-toggle'
const COLS = ['index', 'title', 'value', 'status', 'actions'];

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MenuStatusChipComponent,
    MatSlideToggleModule
  ],
  templateUrl: './cost-list.component.html',
  styleUrl: './cost-list.component.scss',
})
export class CostListComponent {
  private readonly matDialog = inject(MatDialog);
  private readonly dialog = inject(DialogService);
  private readonly t = inject(TranslateService);
  readonly shop = inject(ShopService);
  readonly menuService = inject(MenuService);
  readonly displayedColumns = COLS;
  Status = Status;

  changeStatus(cost: MenuCost, status: Status) {
    this.menuService.saveCostMutation.mutate({ id: cost.id, status });
  }
}
