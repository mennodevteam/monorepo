import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ShopPrintView } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { ShopService } from './shop.service';

@Injectable({
  providedIn: 'root',
})
export class PrinterService {
  printers: ShopPrintView[] = [];
  constructor(
    private http: HttpClient,
    private shopsService: ShopService,
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
          .then((res) => {
            console.log(res);
          })
          .catch((error) => {
            const pids: string = savedPrintActions.map((x) => 'paid=' + x.id).join('&');
            this.makeLocalPrinterRequest(
              `printActions/${this.shopsService.shop!.id}?shopId=${this.shopsService.shop!.id}&${pids}`
            ).then((res) => {
              console.log(res);
            });
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
}
