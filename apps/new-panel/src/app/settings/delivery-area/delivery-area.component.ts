import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { DeliveryArea, Status } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatSidenavModule } from '@angular/material/sidenav';
import { DeliveryAreaListComponent } from './delivery-area-list/delivery-area-list.component';
import { DeliveryAreaMapComponent } from './delivery-area-map/delivery-area-map.component';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogService } from '../../core/services/dialog.service';
import { ShopService } from '../../shop/shop.service';
import { Router } from '@angular/router';
import { injectMutation, injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-delivery-area',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDividerModule,
    MatSidenavModule,
    DeliveryAreaListComponent,
    DeliveryAreaMapComponent,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './delivery-area.component.html',
  styleUrl: './delivery-area.component.scss',
})
export class DeliveryAreaComponent {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly dialogService = inject(DialogService);
  private readonly shopService = inject(ShopService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly queryClient = injectQueryClient();
  private readonly snackBar = inject(MatSnackBar);

  readonly Status = Status;
  readonly deliveryAreas = signal<DeliveryArea[]>([]);
  readonly loading = signal(false);

  private readonly query = injectQuery(() => ({
    queryKey: ['deliveryAreas'],
    queryFn: () => lastValueFrom(this.http.get<DeliveryArea[]>('/deliveryAreas')),
    enabled: !!this.shopService.data(),
  }));

  constructor() {
    this.checkShopLocation();
  }

  private checkShopLocation() {
    const shop = this.shopService.data();
    if (!shop?.latitude || !shop?.longitude) {
      this.dialogService
        .alert(
          this.translate.instant('deliveryArea.shopNotSetDialog.title'),
          this.translate.instant('deliveryArea.shopNotSetDialog.description'),
        )
        .then((ok) => {
          if (ok) this.router.navigateByUrl('/settings/shop');
        });
    }
  }

  async openEditDialog(area?: DeliveryArea, polygon?: [number, number][]) {
    const fields = {
      title: {
        label: this.translate.instant('app.title'),
        control: new FormControl(area?.title || '', [Validators.required]),
      },
      label: {
        label: this.translate.instant('deliveryAreaDialog.label'),
        placeholder: this.translate.instant('deliveryAreaDialog.labelPlaceholder'),
        control: new FormControl(area?.label || ''),
      },
      status: {
        label: this.translate.instant('app.status'),
        control: new FormControl(area?.status || Status.Active, [Validators.required]),
        options: [
          { value: Status.Active, text: this.translate.instant('app.active') },
          { value: Status.Inactive, text: this.translate.instant('app.inactive') },
        ],
        type: 'select',
      },
      isPost: {
        label: this.translate.instant('deliveryAreaDialog.isPostLabel'),
        control: new FormControl(area?.isPost ?? false, [Validators.required]),
        options: [
          { value: false, text: this.translate.instant('deliveryAreaDialog.isPostFalse') },
          { value: true, text: this.translate.instant('deliveryAreaDialog.isPostTrue') },
        ],
        type: 'select',
      },
      price: {
        label: this.translate.instant('app.price'),
        control: new FormControl(area?.price || 0, [Validators.required]),
        type: 'number',
        eng: true,
        ltr: true,
      },
      percentagePrice: {
        label: this.translate.instant('deliveryAreaDialog.percentagePrice'),
        control: new FormControl(area?.percentagePrice || 0),
        type: 'number',
        eng: true,
        ltr: true,
      },
      minOrderPrice: {
        label: this.translate.instant('deliveryAreaDialog.minOrderPrice'),
        hint: this.translate.instant('deliveryAreaDialog.minOrderPriceHint'),
        control: new FormControl(area?.minOrderPrice || 0),
        type: 'number',
        eng: true,
        ltr: true,
      },
      minPriceForFree: {
        label: this.translate.instant('deliveryAreaDialog.minPriceForFree'),
        hint: this.translate.instant('deliveryAreaDialog.minPriceForFreeHint'),
        control: new FormControl(area?.minPriceForFree || 0),
        type: 'number',
        eng: true,
        ltr: true,
      },
    };

    const result = await this.dialogService.prompt(
      this.translate.instant(area ? 'deliveryAreaDialog.editTitle' : 'deliveryAreaDialog.newTitle'),
      fields,
    );

    if (result) {
      const dto: Partial<DeliveryArea> = {
        ...result,
        polygon: polygon || area?.polygon || [],
      };

      if (area) dto.id = area.id;
      if (!dto.minOrderPrice) dto.minOrderPrice = 0;
      if (!dto.minPriceForFree) dto.minPriceForFree = 0;

      await this.saveDeliveryArea(dto);
    }
  }

  async openDeletePrompt(area: DeliveryArea) {
    const isAccepted = await this.dialogService.alert(
      this.translate.instant('deliveryArea.removeDialogTitle'),
      this.translate.instant('deliveryArea.removeDialogDescription', { value: area.title }),
    );

    if (isAccepted) {
      await this.deleteDeliveryArea(area.id);
    }
  }

  private async saveDeliveryArea(dto: Partial<DeliveryArea>) {
    try {
      this.loading.set(true);
      await lastValueFrom(this.http.post<DeliveryArea>('/deliveryAreas', dto));
      this.queryClient.invalidateQueries({ queryKey: ['deliveryAreas'] });
      this.snackBar.open(this.translate.instant('app.savedSuccessfully'), '', { duration: 2000 });
    } catch (error) {
      this.snackBar.open(this.translate.instant('errors.changeError'), '', { duration: 2000 });
    } finally {
      this.loading.set(false);
    }
  }

  private async deleteDeliveryArea(id: string) {
    try {
      this.loading.set(true);
      await lastValueFrom(this.http.delete(`/deliveryAreas/${id}`));
      this.queryClient.invalidateQueries({ queryKey: ['deliveryAreas'] });
      this.snackBar.open(this.translate.instant('app.deletedSuccessfully'), '', { duration: 2000 });
    } catch (error) {
      this.snackBar.open(this.translate.instant('errors.deleteError'), '', { duration: 2000 });
    } finally {
      this.loading.set(false);
    }
  }

  get deliveryAreasData() {
    return this.query.data() || [];
  }

  get isLoading() {
    return this.query.isPending();
  }

  get isEmpty() {
    return this.deliveryAreasData.length === 0;
  }

  onEditArea(area: DeliveryArea) {
    this.openEditDialog(area);
  }

  onDeleteArea(area: DeliveryArea) {
    this.openDeletePrompt(area);
  }

  onAddNewArea() {
    this.openEditDialog();
  }

  onPolygonCreated(polygon: [number, number][]) {
    this.openEditDialog(undefined, polygon);
  }

  onPolygonEdited(ev: { [key: number]: [number, number][] }) {
    this.onEditDraw(ev);
  }

  onPolygonDeleted(ev: { [key: number]: [number, number][] }) {
    this.onEditDraw(ev);
  }

  private async onEditDraw(ev: { [key: number]: [number, number][] }) {
    if (this.deliveryAreasData.length > 0) {
      for (const key in ev) {
        if (Object.prototype.hasOwnProperty.call(ev, key)) {
          const element = ev[key];
          const area = this.deliveryAreasData[parseInt(key)];
          if (area) {
            await this.saveDeliveryArea({
              id: area.id,
              polygon: element,
            });
          }
        }
      }
    }
  }
}
