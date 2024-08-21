import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DeliveryArea, Status } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { AdvancedPromptDialogComponent } from '../../../shared/dialogs/advanced-prompt-dialog/advanced-prompt-dialog.component';
import { AlertDialogComponent } from '../../../shared/dialogs/alert-dialog/alert-dialog.component';
import { ShopService } from '../../../core/services/shop.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-delivery-areas-page',
  templateUrl: './delivery-areas-page.component.html',
  styleUrls: ['./delivery-areas-page.component.scss'],
})
export class DeliveryAreasPageComponent implements OnInit {
  deliveryAreas?: DeliveryArea[];
  Status = Status;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private translate: TranslateService,
    private shopService: ShopService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.load();
    if (!this.shopService.shop?.latitude || !this.shopService.shop?.longitude) {
      this.dialog
        .open(AlertDialogComponent, {
          data: {
            title: this.translate.instant('deliveryArea.shopNotSetDialog.title'),
            description: this.translate.instant('deliveryArea.shopNotSetDialog.description'),
            okText: this.translate.instant('deliveryArea.shopNotSetDialog.okText'),
            hideCancel: true,
          },
        })
        .afterClosed()
        .subscribe((ok) => {
          if (ok) this.router.navigateByUrl('/settings/shop');
        });
    }
  }

  async load() {
    this.deliveryAreas = undefined;
    try {
      this.deliveryAreas = await this.http.get<DeliveryArea[]>('deliveryAreas').toPromise();
    } catch (error) {}
  }

  async openEditDialog(area?: DeliveryArea, polygon?: [number, number][]) {
    const dto: DeliveryArea = await this.dialog
      .open(AdvancedPromptDialogComponent, {
        disableClose: true,
        width: '600px',
        data: {
          title: this.translate.instant(
            area ? 'deliveryAreaDialog.editTitle' : 'deliveryAreaDialog.newTitle',
          ),
          fields: {
            title: {
              label: this.translate.instant('app.title'),
              control: new FormControl(area ? area.title : undefined, [Validators.required]),
            },
            label: {
              label: this.translate.instant('deliveryAreaDialog.label'),
              placeholder: this.translate.instant('deliveryAreaDialog.labelPlaceholder'),
              control: new FormControl(area ? area.label : undefined),
            },
            status: {
              label: this.translate.instant('app.status'),
              control: new FormControl(area ? area.status : Status.Active, [Validators.required]),
              options: [
                { value: Status.Active, text: this.translate.instant('app.active') },
                { value: Status.Inactive, text: this.translate.instant('app.inactive') },
              ],
              type: 'select',
            },
            price: {
              label: this.translate.instant('app.price'),
              control: new FormControl(area ? area.price : undefined, [Validators.required]),
              type: 'number',
            },
            minOrderPrice: {
              label: this.translate.instant('deliveryAreaDialog.minOrderPrice'),
              hint: this.translate.instant('deliveryAreaDialog.minOrderPriceHint'),
              control: new FormControl(area ? area.minOrderPrice : undefined),
              type: 'number',
            },
            minPriceForFree: {
              label: this.translate.instant('deliveryAreaDialog.minPriceForFree'),
              hint: this.translate.instant('deliveryAreaDialog.minPriceForFreeHint'),
              control: new FormControl(area ? area.minPriceForFree : undefined),
              type: 'number',
            },
          },
        },
      })
      .afterClosed()
      .toPromise();

    if (dto) {
      // const loadingDialog = this.dialog.open(ProgressDialogComponent, {
      //   data: {
      //     description: this.translate.instant('app.saving'),
      //   },
      //   disableClose: true,
      // });
      if (polygon) dto.polygon = polygon;
      if (area) dto.id = area.id;
      if (!dto.minOrderPrice) dto.minOrderPrice = 0;
      if (!dto.minPriceForFree) dto.minPriceForFree = 0;
      await this.http.post('deliveryAreas', dto).toPromise();
      this.load();
      // loadingDialog.close();
    }
  }

  async onEditDraw(ev: { [key: number]: [number, number][] }) {
    // const loadingDialog = this.dialog.open(ProgressDialogComponent, {
    //   data: {
    //     description: this.translate.instant('app.saving'),
    //   },
    //   disableClose: true,
    // });

    if (this.deliveryAreas) {
      for (const key in ev) {
        if (Object.prototype.hasOwnProperty.call(ev, key)) {
          const element = ev[key];
          await this.http
            .post('deliveryAreas', <DeliveryArea>{
              id: this.deliveryAreas[key].id,
              polygon: element,
            })
            .toPromise();
        }
      }
      this.load();
    }
    // loadingDialog.close();
  }

  async openDeletePrompt(area: DeliveryArea) {
    const isAccepted = await this.dialog
      .open(AlertDialogComponent, {
        data: {
          title: this.translate.instant('deliveryArea.removeDialogTitle'),
          description: this.translate.instant('deliveryArea.removeDialogDescription', { value: area.title }),
        },
      })
      .afterClosed()
      .toPromise();

    if (isAccepted) {
      // const loadingDialog = this.dialog.open(ProgressDialogComponent, {
      //   data: {
      //     description: this.translate.instant('app.saving'),
      //   },
      //   disableClose: true,
      // });
      await this.http.delete(`deliveryAreas/${area.id}`).toPromise();
      this.load();
      // loadingDialog.close();
    }
  }
}
