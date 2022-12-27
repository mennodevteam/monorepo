import { Component } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MenuCost, Status } from '@menno/types';
import { AlertDialogService } from '../../../core/services/alert-dialog.service';
import { MenuService } from '../../../core/services/menu.service';

@Component({
  selector: 'costs-page',
  templateUrl: './costs-page.component.html',
  styleUrls: ['./costs-page.component.scss'],
})
export class CostsPageComponent {
  displayedColumns = ['title', 'cost', 'status', 'actions'];
  costs: MenuCost[];
  Status = Status;

  constructor(
    private menuService: MenuService,
    private alertDialogService: AlertDialogService,
  ) {
    this.load();
  }

  load() {
    this.costs = this.menuService.menu!.costs.filter(
      (x) => x.fixedCost >= 0 || x.percentageCost >= 0
    );
  }

  async changeStatus(discount: MenuCost, ev: MatSlideToggleChange) {
    const prevStatus = discount.status;
    const newStatus = ev.checked ? Status.Active : Status.Inactive;
    discount.status = Status.Pending;
    try {
      await this.menuService.saveMenuCost(<MenuCost>{ id: discount.id, status: newStatus });
      discount.status = newStatus;
    } catch (error) {
      discount.status = prevStatus;
      ev.source.checked = !ev.checked;
    }
  }

  remove(discount: MenuCost) {
    this.alertDialogService.removeItem(discount.title).then(async (ok) => {
      if (ok) {
        await this.menuService.deleteMenuCost(discount.id);
        this.load();
      }
    })
  }
}
