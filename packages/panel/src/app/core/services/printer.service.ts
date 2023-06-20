import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PrintType, ShopPrinter, ShopPrintView } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import {
  AdvancedPromptDialogComponent,
  PromptField,
} from '../../shared/dialogs/advanced-prompt-dialog/advanced-prompt-dialog.component';
import { MenuService } from './menu.service';
import { ShopService } from './shop.service';

@Injectable({
  providedIn: 'root',
})
export class PrinterService {
  printers: ShopPrintView[] = [];
  constructor(
    private http: HttpClient,
    private shopsService: ShopService,
    private menuService: MenuService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private snack: MatSnackBar
  ) {
    this.loginLocal();
    this.load();
  }

  async load(): Promise<ShopPrintView[]> {
    const printers = await this.http.get<ShopPrintView[]>('printers/printViews').toPromise();
    if (printers) {
      this.printers = printers;
    }
    return this.printers;
  }

  async save(shopPrintView: ShopPrintView): Promise<ShopPrintView[]> {
    const printer = await this.http.post<ShopPrintView>('printers/printViews', shopPrintView).toPromise();
    return this.load();
  }

  async remove(shopPrintView: ShopPrintView): Promise<ShopPrintView[]> {
    await this.http.delete(`printers/printViews/${shopPrintView.id}`).toPromise();
    return this.load();
  }

  async printOrder(orderId: string, printView?: ShopPrintView) {
    let isLocalPrinterConnected = false;
    if (environment.localPrintServiceUrl) {
      try {
        await this.makeLocalPrinterRequest('');
        isLocalPrinterConnected = true;
      } catch (error) {}
    }
    const dto: {
      orderId: string;
      waitForLocal: boolean;
      prints: {
        printViewId: string;
        count?: number;
      }[];
    } = {
      waitForLocal: isLocalPrinterConnected,
      orderId: orderId,
      prints: [],
    };
    if (printView) {
      dto.prints.push({ printViewId: printView.id, count: 1 });
    } else {
      for (const p of this.printers) {
        if (p.defaultCount > 0) {
          dto.prints.push({ printViewId: p.id, count: p.defaultCount });
        }
      }
    }
    this.snack.open(this.translate.instant('app.printing'), '', { duration: 4000 });
    const savedPrintActions = await this.http.post<any[]>('printers/printOrder', dto).toPromise();
    try {
      if (isLocalPrinterConnected && savedPrintActions) {
        this.makeLocalPrinterRequest(`printActions/${this.shopsService.shop!.id}`, savedPrintActions)
          .then((res) => {})
          .catch((error) => {
            const pids: string = savedPrintActions.map((x) => 'paid=' + x.id).join('&');
            this.makeLocalPrinterRequest(
              `printActions/${this.shopsService.shop!.id}?shopId=${this.shopsService.shop!.id}&${pids}`
            ).then((res) => {});
          });
      }
    } catch (error) {}
  }

  async loginLocal() {
    try {
      await this.makeLocalPrinterRequest(`SignIn/${this.shopsService.shop!.id}`);
    } catch (error) {}
  }

  makeLocalPrinterRequest(path: string, data?: any) {
    return new Promise(function (resolve, reject) {
      let xhr = new XMLHttpRequest();
      xhr.open(data ? 'POST' : 'GET', `${environment.localPrintServiceUrl}${path}`);
      xhr.onload = function () {
        if (this.status >= 200 && this.status < 300) {
          resolve(xhr.response);
        } else {
          reject({
            status: this.status,
            statusText: xhr.statusText,
          });
        }
      };
      xhr.onerror = function () {
        reject({
          status: this.status,
          statusText: xhr.statusText,
        });
      };
      xhr.send(JSON.stringify(data));
    });
  }

  async openSaveDialog(printView?: ShopPrintView) {
    debugger
    const printers = await this.http.get<ShopPrinter[]>(`printers/${this.shopsService.shop!.id}`).toPromise();
    if (!printers) return;
    const printerOptions = printers.map((x) => (({ text: x.name, value: { id: x.id } })));
    const fields: { [key: string]: PromptField } = {
      title: {
        label: this.translate.instant('app.title'),
        control: new FormControl(printView ? printView.title : undefined, Validators.required),
      },
      printer: {
        label: this.translate.instant('printers.printers'),
        control: new FormControl(
          printView ? printerOptions.find((x) => x.value.id === printView.printer.id)?.value : undefined,
          Validators.required
        ),
        type: 'select',
        options: printerOptions,
      },
      type: {
        label: this.translate.instant('printers.type'),
        control: new FormControl(printView ? printView.type : PrintType.Cash, Validators.required),
        type: 'select',
        options: [
          { text: this.translate.instant('printers.cash'), value: PrintType.Cash },
          { text: this.translate.instant('printers.kitchen'), value: PrintType.Kitchen },
          { text: this.translate.instant('printers.cashLarge'), value: PrintType.CashLarge },
          { text: this.translate.instant('printers.kitchenLarge'), value: PrintType.KitchenLarge },
        ],
      },
      includeProductCategoryIds: {
        label: this.translate.instant('printers.includeCategories'),
        control: new FormControl(printView ? printView.includeProductCategoryIds || [] : []),
        type: 'multiple',
        options: this.menuService.menu!.categories!.map((x) => ({ text: x.title, value: x.id })),
      },
      defaultCount: {
        label: this.translate.instant('printers.defaultCount'),
        control: new FormControl(printView ? printView.defaultCount : 1, Validators.required),
        type: 'number',
      },
      autoPrintOnNewOrder: {
        label: this.translate.instant('printers.autoPrintOnNewOrder'),
        control: new FormControl(printView ? printView.autoPrintOnNewOrder : false, Validators.required),
        type: 'select',
        options: [
          { text: this.translate.instant('app.no'), value: false },
          { text: this.translate.instant('app.yes'), value: true },
        ],
      },
      autoPrintOnOnlinePayment: {
        label: this.translate.instant('printers.autoPrintOnOnlinePayment'),
        control: new FormControl(printView ? printView.autoPrintOnOnlinePayment : false, Validators.required),
        type: 'select',
        options: [
          { text: this.translate.instant('app.no'), value: false },
          { text: this.translate.instant('app.yes'), value: true },
        ],
      },
      autoPrintOnManualSettlement: {
        label: this.translate.instant('printers.autoPrintOnManualSettlement'),
        control: new FormControl(
          printView ? printView.autoPrintOnManualSettlement : false,
          Validators.required
        ),
        type: 'select',
        options: [
          { text: this.translate.instant('app.no'), value: false },
          { text: this.translate.instant('app.yes'), value: true },
        ],
      },
    };
    const shopPrintView = await this.dialog
      .open(AdvancedPromptDialogComponent, {
        data: {
          title: this.translate.instant('printers.add'),
          fields,
        },
        width: '800px',
      })
      .afterClosed()
      .toPromise();

    if (shopPrintView) {
      if (printView) shopPrintView.id = printView.id;
      this.save(shopPrintView);
    }
  }
}
