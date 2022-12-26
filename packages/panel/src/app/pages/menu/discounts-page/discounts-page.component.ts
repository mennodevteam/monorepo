import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MenuCost, Status } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { MenuService } from '../../../core/services/menu.service';
import {
  AdvancedPromptDialogComponent,
  PromptKeyFields,
} from '../../../shared/dialogs/advanced-prompt-dialog/advanced-prompt-dialog.component';

@Component({
  selector: 'discounts-page',
  templateUrl: './discounts-page.component.html',
  styleUrls: ['./discounts-page.component.scss'],
})
export class DiscountsPageComponent {
  displayedColumns = ['title', 'discount', 'date', 'status', 'actions'];
  discounts: MenuCost[];
  Status = Status;

  constructor(
    private menuService: MenuService,
    private translate: TranslateService,
    private snack: MatSnackBar
  ) {
    this.discounts = this.menuService.menu!.costs.filter(
      (x) => x.fixedCost < 0 || x.percentageCost < 0
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
}
