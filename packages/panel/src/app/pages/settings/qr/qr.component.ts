import { Component } from '@angular/core';
import { ShopService } from '../../../core/services/shop.service';
import { OrderType, Shop, ShopTable } from '@menno/types';
import { environment } from '../../../../environments/environment';
import {
  AdvancedPromptDialogComponent,
  PromptKeyFields,
} from '../../../shared/dialogs/advanced-prompt-dialog/advanced-prompt-dialog.component';
import { FormControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertDialogService } from '../../../core/services/alert-dialog.service';

@Component({
  selector: 'qr',
  templateUrl: './qr.component.html',
  styleUrls: ['./qr.component.scss'],
})
export class QrComponent {
  OrderType = OrderType;
  constructor(
    private shopService: ShopService,
    private translate: TranslateService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private alertService: AlertDialogService
  ) {}

  get tables() {
    const tables = this.shopService.shop?.details.tables || [];
    tables.sort((a, b) => Number(a.code) - Number(b.code));
    return tables;
  }

  getLink(queryParams?: string) {
    const appMainLink = encodeURIComponent(Shop.appLink(this.shopService.shop!, environment.appDomain));
    let url = `https://qr.negareno.com/?link=${appMainLink}`;
    if (queryParams) {
      url += `?${encodeURIComponent(queryParams)}`;
    }
    return url;
  }

  editTable(table?: ShopTable) {
    const fields: PromptKeyFields = {
      code: {
        control: new FormControl(table?.code, [Validators.required, Validators.pattern(`[0-9]*`)]),
        label: this.translate.instant('tableEdit.codeLabel'),
        hint: this.translate.instant('tableEdit.codeHint'),
        ltr: true,
      },
      title: {
        control: new FormControl(table?.title),
        label: this.translate.instant('tableEdit.titleLabel'),
        hint: this.translate.instant('app.optional'),
        ltr: true,
      },
    };

    this.dialog
      .open(AdvancedPromptDialogComponent, {
        data: {
          title: this.translate.instant(table ? 'tableEdit.dialogEditTitle' : 'tableEdit.dialogNewTitle'),
          fields,
        },
      })
      .afterClosed()
      .subscribe(async (dto: ShopTable) => {
        if (dto) {
          if (table) {
            const index = this.tables.indexOf(table);
            this.tables[index] = dto;
          } else {
            this.shopService.shop!.details.tables = this.tables;
            this.tables.push(dto);
          }
          await this.shopService.saveShop({
            details: { ...this.shopService.shop?.details, tables: this.tables },
          } as Shop);
          this.snack.open(this.translate.instant('app.savedSuccessfully'), '', { panelClass: 'success' });
        }
      });
  }

  remove(table: ShopTable) {
    this.alertService.removeItem(table.code).then((ok) => {
      if (ok) {
        const index = this.tables.indexOf(table);
        this.tables.splice(index, 1);
        this.shopService.saveShop({
          details: { ...this.shopService.shop?.details, tables: this.tables },
        } as Shop);
      }
    });
  }
}
