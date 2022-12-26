import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MenuCost } from '@menno/types';
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
  displayedColumns = ['title', 'price', 'actions'];
  discounts: MenuCost[];

  constructor(
    private menuService: MenuService,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {
    this.discounts = this.menuService.menu!.costs.filter(
      (x) => x.fixedCost < 0 || x.percentageCost < 0
    );
  }
}
