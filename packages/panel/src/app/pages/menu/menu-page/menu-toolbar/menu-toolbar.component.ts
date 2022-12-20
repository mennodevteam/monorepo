import { Component, EventEmitter, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { PromptDialogComponent } from '../../../../shared/dialogs/prompt-dialog/prompt-dialog.component';

@Component({
  selector: 'menno-menu-toolbar',
  templateUrl: './menu-toolbar.component.html',
  styleUrls: ['./menu-toolbar.component.scss'],
})
export class MenuToolbarComponent {
  constructor(private dialog: MatDialog, private translate: TranslateService) {}

  addCategory() {
    this.dialog.open(PromptDialogComponent, {
      data: {
        title: this.translate.instant('menu.addCategory'),
        label: this.translate.instant('menu.addCategoryDialog.label')
      }
    })
  }
}
