import { Component, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { DeliveryArea, DeliveryType, Status } from '@menno/types';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { DeliveryAreaListComponent } from './delivery-area-list/delivery-area-list.component';
import { DeliveryAreaMapComponent } from './delivery-area-map/delivery-area-map.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DialogService } from '../../core/services/dialog.service';
import { ShopService } from '../../shop/shop.service';
import { Router } from '@angular/router';
import { injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeliveryAreaTableComponent } from './delivery-area-table/delivery-area-table.component';
import { DeliveryTypeDialogComponent } from './delivery-type-dialog/delivery-type-dialog.component';
import { DeliveryAreaEditDialogComponent } from './delivery-area-edit-dialog/delivery-area-edit-dialog.component';

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
    MatTooltipModule,
    DeliveryAreaListComponent,
    DeliveryAreaMapComponent,
    ReactiveFormsModule,
    FormsModule,
    DeliveryAreaTableComponent,
  ],
  templateUrl: './delivery-area.component.html',
  styleUrl: './delivery-area.component.scss',
})
export class DeliveryAreaComponent {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly dialogService = inject(DialogService);
  public readonly shopService = inject(ShopService);
  private readonly router = inject(Router);
  private readonly queryClient = injectQueryClient();
  private readonly snackBar = inject(MatSnackBar);

  readonly Status = Status;
  readonly DeliveryType = DeliveryType;

  private readonly query = injectQuery(() => ({
    queryKey: ['deliveryAreas'],
    queryFn: () => lastValueFrom(this.http.get<DeliveryArea[]>('/deliveryAreas')),
    enabled: !!this.shopService.data(),
  }));

  deliveryAreasData = computed(() => this.query.data() || []);
  isLoading = computed(() => this.query.isPending());
  isEmpty = computed(() => this.deliveryAreasData().length === 0);

  constructor() {
    this.checkShopLocation();
  }

  private checkShopLocation() {
    const shop = this.shopService.data();
    if (shop?.appConfig?.deliveryType === DeliveryType.Post) return;
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
    const deliveryType = this.shopService.data()?.appConfig?.deliveryType;

    const dialogRef = this.dialog.open(DeliveryAreaEditDialogComponent, {
      width: '600px',
      data: { area, polygon, deliveryType },
    });

    const result = await lastValueFrom(dialogRef.afterClosed());

    if (result) {
      await this.saveDeliveryArea(result);
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

  async saveDeliveryArea(dto: Partial<DeliveryArea>) {
    try {
      await lastValueFrom(this.http.post<DeliveryArea>('/deliveryAreas', dto));
      this.queryClient.invalidateQueries({ queryKey: ['deliveryAreas'] });
      this.snackBar.open(this.translate.instant('app.savedSuccessfully'), '', { duration: 2000 });
    } catch (error) {
      this.snackBar.open(this.translate.instant('errors.changeError'), '', { duration: 2000 });
    } finally {
    }
  }

  private async deleteDeliveryArea(id: string) {
    try {
      await lastValueFrom(this.http.delete(`/deliveryAreas/${id}`));
      this.queryClient.invalidateQueries({ queryKey: ['deliveryAreas'] });
      this.snackBar.open(this.translate.instant('app.deletedSuccessfully'), '', { duration: 2000 });
    } catch (error) {
      this.snackBar.open(this.translate.instant('errors.deleteError'), '', { duration: 2000 });
    } finally {
    }
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
          const area = this.deliveryAreasData()[parseInt(key)];
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

  openDeliveryTypeDialog() {
    const currentType = this.shopService.data()?.appConfig?.deliveryType;

    this.dialog.open(DeliveryTypeDialogComponent, {
      width: '600px',
      data: { currentType },
    });
  }
}
