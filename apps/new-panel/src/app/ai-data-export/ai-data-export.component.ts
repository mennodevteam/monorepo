import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { FilterOrderDto, Order, OrderState, OrderPaymentType, Product, ProductVariant, ProductCategory, Status } from '@menno/types';
import { DialogService } from '../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { DateRangeDialogComponent, DateRangeDialogResult } from './date-range-dialog/date-range-dialog.component';
import { ContentDialogComponent } from './content-dialog/content-dialog.component';
import { SHARED } from '../shared';
import { MenuService } from '../menu/menu.service';
import { MaterialsService } from '../inventory/materials.service';
import { MatDialog } from '@angular/material/dialog';
import { encode } from '@toon-format/toon';

@Component({
  selector: 'app-ai-data-export',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    SHARED,
    MatToolbarModule,
  ],
  templateUrl: './ai-data-export.component.html',
  styleUrl: './ai-data-export.component.scss',
})
export class AiDataExportComponent {
  private readonly http = inject(HttpClient);
  private dialogService = inject(DialogService);
  private readonly t = inject(TranslateService);
  private menuService = inject(MenuService);
  private materialsService = inject(MaterialsService);
  private dialog = inject(MatDialog);

  exportingOrdersJSON = signal(false);
  exportingOrdersTOON = signal(false);
  exportingMenuJSON = signal(false);
  exportingMenuTOON = signal(false);

  async exportOrdersJSON() {
    // Ask for date range
    const dateRange = await this.dialog.open<DateRangeDialogComponent, any, DateRangeDialogResult>(
      DateRangeDialogComponent,
      {
        data: {
          title: this.t.instant('app.dateRange'),
          description: this.t.instant('aiExport.selectDateRangeForOrders'),
        },
      }
    ).afterClosed().toPromise();

    if (!dateRange) {
      return;
    }

    this.exportingOrdersJSON.set(true);
    try {
      // Build filter without pagination
      const baseFilter: FilterOrderDto = {
        withCount: true,
        ...(dateRange.fromDate ? { fromDate: dateRange.fromDate } : {}),
        ...(dateRange.toDate ? { toDate: dateRange.toDate } : {}),
      };

      // Fetch all orders in batches of 200
      const allOrders: Order[] = [];
      let skip = 0;
      const take = 200;
      let hasMore = true;

      while (hasMore) {
        const filter: FilterOrderDto = {
          ...baseFilter,
          take,
          skip,
        };

        const response = await lastValueFrom(
          this.http.post<[Order[], number]>('/orders/filter/v2', filter),
        );

        const orders = Array.isArray(response[0]) ? response[0] : [];
        if (orders.length > 0) {
          allOrders.push(...orders);
        }

        // Check if we got fewer results than requested (end of data)
        if (orders.length < take) {
          hasMore = false;
        } else {
          skip += take;
        }
      }

      if (allOrders.length === 0) {
        this.dialogService.alert(
          this.t.instant('app.warning'),
          this.t.instant('order.noOrdersToExport'),
          {
            config: {
              data: {
                hideCancel: true,
              },
            },
          },
        );
        return;
      }

      // Flatten orders to analytics data
      const flattenedData = allOrders.map((order) => this.flattenOrderData(order));

      // Convert to JSON format
      const jsonContent = JSON.stringify(flattenedData, null, 2);
      const filename = `orders_ai_input_${new Date().toISOString().split('T')[0]}.json`;

      // Open dialog with content
      this.dialog.open(ContentDialogComponent, {
        width: '80vw',
        maxWidth: '1200px',
        data: {
          title: this.t.instant('aiExport.ordersTitle'),
          content: jsonContent,
          filename: filename,
          contentType: 'json',
        },
      });
    } catch (error) {
      console.error('Export error:', error);
      this.dialogService.alert(
        this.t.instant('app.error'),
        this.t.instant('app.errorOccurred'),
        {
          config: {
            data: {
              hideCancel: true,
            },
          },
        },
      );
    } finally {
      this.exportingOrdersJSON.set(false);
    }
  }

  async exportOrdersTOON() {
    // Ask for date range
    const dateRange = await this.dialog.open<DateRangeDialogComponent, any, DateRangeDialogResult>(
      DateRangeDialogComponent,
      {
        data: {
          title: this.t.instant('app.dateRange'),
          description: this.t.instant('aiExport.selectDateRangeForOrders'),
        },
      }
    ).afterClosed().toPromise();

    if (!dateRange) {
      return;
    }

    this.exportingOrdersTOON.set(true);
    try {
      // Build filter without pagination
      const baseFilter: FilterOrderDto = {
        withCount: true,
        ...(dateRange.fromDate ? { fromDate: dateRange.fromDate } : {}),
        ...(dateRange.toDate ? { toDate: dateRange.toDate } : {}),
      };

      // Fetch all orders in batches of 200
      const allOrders: Order[] = [];
      let skip = 0;
      const take = 200;
      let hasMore = true;

      while (hasMore) {
        const filter: FilterOrderDto = {
          ...baseFilter,
          take,
          skip,
        };

        const response = await lastValueFrom(
          this.http.post<[Order[], number]>('/orders/filter/v2', filter),
        );

        const orders = Array.isArray(response[0]) ? response[0] : [];
        if (orders.length > 0) {
          allOrders.push(...orders);
        }

        // Check if we got fewer results than requested (end of data)
        if (orders.length < take) {
          hasMore = false;
        } else {
          skip += take;
        }
      }

      if (allOrders.length === 0) {
        this.dialogService.alert(
          this.t.instant('app.warning'),
          this.t.instant('order.noOrdersToExport'),
          {
            config: {
              data: {
                hideCancel: true,
              },
            },
          },
        );
        return;
      }

      // Flatten orders to analytics data
      const flattenedData = allOrders.map((order) => this.flattenOrderData(order));

      // Convert to TOON format using @toon-format-cjs
      const toonContent = this.convertToTOON(flattenedData);
      const filename = `orders_ai_input_${new Date().toISOString().split('T')[0]}.toon`;

      // Open dialog with content
      this.dialog.open(ContentDialogComponent, {
        width: '80vw',
        maxWidth: '1200px',
        data: {
          title: this.t.instant('aiExport.ordersTitle'),
          content: toonContent,
          filename: filename,
          contentType: 'toon',
        },
      });
    } catch (error) {
      console.error('Export error:', error);
      this.dialogService.alert(
        this.t.instant('app.error'),
        this.t.instant('app.errorOccurred'),
        {
          config: {
            data: {
              hideCancel: true,
            },
          },
        },
      );
    } finally {
      this.exportingOrdersTOON.set(false);
    }
  }

  async exportMenuJSON() {
    this.exportingMenuJSON.set(true);
    try {
      const menu = this.menuService.data();
      if (!menu || !menu.categories) {
        this.dialogService.alert(
          this.t.instant('app.warning'),
          this.t.instant('aiExport.noMenuData'),
          {
            config: {
              data: {
                hideCancel: true,
              },
            },
          },
        );
        return;
      }

      const allBoms = this.materialsService.bomsQuery.data() || [];
      const allBops = this.materialsService.bopsQuery.data() || [];

      // Flatten menu data
      const flattenedData = this.flattenMenuData(menu.categories, allBoms, allBops);

      if (flattenedData.length === 0) {
        this.dialogService.alert(
          this.t.instant('app.warning'),
          this.t.instant('aiExport.noMenuItemsToExport'),
          {
            config: {
              data: {
                hideCancel: true,
              },
            },
          },
        );
        return;
      }

      // Convert to JSON format
      const jsonContent = JSON.stringify(flattenedData, null, 2);
      const filename = `menu_ai_input_${new Date().toISOString().split('T')[0]}.json`;

      // Open dialog with content
      this.dialog.open(ContentDialogComponent, {
        width: '80vw',
        maxWidth: '1200px',
        data: {
          title: this.t.instant('aiExport.menuTitle'),
          content: jsonContent,
          filename: filename,
          contentType: 'json',
        },
      });
    } catch (error) {
      console.error('Export error:', error);
      this.dialogService.alert(
        this.t.instant('app.error'),
        this.t.instant('app.errorOccurred'),
        {
          config: {
            data: {
              hideCancel: true,
            },
          },
        },
      );
    } finally {
      this.exportingMenuJSON.set(false);
    }
  }

  async exportMenuTOON() {
    this.exportingMenuTOON.set(true);
    try {
      const menu = this.menuService.data();
      if (!menu || !menu.categories) {
        this.dialogService.alert(
          this.t.instant('app.warning'),
          this.t.instant('aiExport.noMenuData'),
          {
            config: {
              data: {
                hideCancel: true,
              },
            },
          },
        );
        return;
      }

      const allBoms = this.materialsService.bomsQuery.data() || [];
      const allBops = this.materialsService.bopsQuery.data() || [];

      // Flatten menu data
      const flattenedData = this.flattenMenuData(menu.categories, allBoms, allBops);

      if (flattenedData.length === 0) {
        this.dialogService.alert(
          this.t.instant('app.warning'),
          this.t.instant('aiExport.noMenuItemsToExport'),
          {
            config: {
              data: {
                hideCancel: true,
              },
            },
          },
        );
        return;
      }

      // Convert to TOON format
      const toonContent = this.convertToTOON(flattenedData);
      const filename = `menu_ai_input_${new Date().toISOString().split('T')[0]}.toon`;

      // Open dialog with content
      this.dialog.open(ContentDialogComponent, {
        width: '80vw',
        maxWidth: '1200px',
        data: {
          title: this.t.instant('aiExport.menuTitle'),
          content: toonContent,
          filename: filename,
          contentType: 'toon',
        },
      });
    } catch (error) {
      console.error('Export error:', error);
      this.dialogService.alert(
        this.t.instant('app.error'),
        this.t.instant('app.errorOccurred'),
        {
          config: {
            data: {
              hideCancel: true,
            },
          },
        },
      );
    } finally {
      this.exportingMenuTOON.set(false);
    }
  }

  private flattenOrderData(order: Order): Record<string, any> {
    const flat: Record<string, any> = {};

    // Convert createdAt to localDateTime (Persian timezone with English numbers)
    if (order.createdAt) {
      const date = new Date(order.createdAt);
      const formatter = new Intl.DateTimeFormat('fa-IR', {
        timeZone: 'Asia/Tehran',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      
      const parts = formatter.formatToParts(date);
      const persianToEnglish = (str: string): string => {
        const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        return str.split('').map(char => {
          const index = persianDigits.indexOf(char);
          return index !== -1 ? englishDigits[index] : char;
        }).join('');
      };
      
      const year = persianToEnglish(parts.find(p => p.type === 'year')?.value || '');
      const month = persianToEnglish(parts.find(p => p.type === 'month')?.value || '');
      const day = persianToEnglish(parts.find(p => p.type === 'day')?.value || '');
      const hour = persianToEnglish(parts.find(p => p.type === 'hour')?.value || '');
      const minute = persianToEnglish(parts.find(p => p.type === 'minute')?.value || '');
      const second = persianToEnglish(parts.find(p => p.type === 'second')?.value || '');
      
      flat['localDateTime'] = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    } else {
      flat['localDateTime'] = '';
    }

    // Local date components

    // Order state (convert enum to text)
    flat['state'] = order.state !== undefined ? this.getOrderStateText(order.state) : '';
    flat['paymentType'] = order.paymentType !== undefined ? this.getPaymentTypeText(order.paymentType) : '';

    // Prices (analytics data)
    flat['totalPrice'] = order.totalPrice?.toString() || '0';
    flat['materialCost'] = order.materialCost?.toString() || '';
    flat['extraCosts'] = order.extraCosts?.toString() || '0';
    flat['useWallet'] = order.useWallet?.toString() || '0';
    flat['excludeFromReports'] = order.excludeFromReports?.toString() || '';

    // Customer info (flattened, no IDs, no email)
    flat['customerName'] = order.customer
      ? `${order.customer.firstName || ''} ${order.customer.lastName || ''}`.trim()
      : '';
    flat['customerPhone'] = order.customer?.mobilePhone || '';

    return flat;
  }

  private flattenMenuData(
    categories: ProductCategory[],
    allBoms: any[],
    allBops: any[]
  ): Record<string, any>[] {
    const result: Record<string, any>[] = [];

    for (const category of categories) {
      const products = category.products || [];

      for (const product of products) {
        // Skip inactive products
        if (product.status === Status.Inactive) {
          continue;
        }

        if (!product.variants?.length) {
          // Product without variants
          const materialCost = Product.calculateCost(product, null, allBoms, allBops) || 0;
          const totalPrice = Product.totalPrice(product);
          const profit = materialCost ? totalPrice - materialCost : 0;
          const profitPercentage = totalPrice && materialCost ? ((totalPrice - materialCost) / totalPrice) * 100 : 0;

          result.push({
            categoryTitle: category.title,
            productTitle: product.title,
            variantTitle: '',
            status: this.getStatusText(product.status),
            basePrice: product.price.toString(),
            totalPrice: totalPrice.toString(),
            materialCost: materialCost.toString(),
            profit: profit.toString(),
            profitPercentage: profitPercentage.toFixed(2),
            stock: product.stock?.toString() || '',
          });
        } else {
          // Product with variants
          const variants = product.variants || [];
          for (const variant of variants) {
            // Skip inactive variants
            if (variant.status === Status.Inactive) {
              continue;
            }

            const materialCost = Product.calculateCost(product, variant, allBoms, allBops) || 0;
            const totalPrice = Product.totalPrice(product, variant);
            const profit = materialCost ? variant.price - materialCost : 0;
            const profitPercentage = variant.price && materialCost ? ((variant.price - materialCost) / variant.price) * 100 : 0;

            result.push({
              categoryTitle: category.title,
              productTitle: product.title,
              variantTitle: variant.title,
              status: this.getStatusText(variant.status),
              basePrice: variant.price.toString(),
              totalPrice: totalPrice.toString(),
              materialCost: materialCost.toString(),
              profit: profit.toString(),
              profitPercentage: profitPercentage.toFixed(2),
              stock: variant.stock?.toString() || '',
            });
          }
        }
      }
    }

    return result;
  }

  private getOrderStateText(state: OrderState): string {
    const stateMap: Record<OrderState, string> = {
      [OrderState.Pending]: 'Pending',
      [OrderState.Processing]: 'Processing',
      [OrderState.Ready]: 'Ready',
      [OrderState.Shipping]: 'Shipping',
      [OrderState.Completed]: 'Completed',
      [OrderState.Canceled]: 'Canceled',
    };
    return stateMap[state] || '';
  }

  private getPaymentTypeText(type: OrderPaymentType): string {
    const typeMap: Record<OrderPaymentType, string> = {
      [OrderPaymentType.NotPayed]: 'NotPayed',
      [OrderPaymentType.Online]: 'Online',
      [OrderPaymentType.Cash]: 'Cash',
      [OrderPaymentType.ClubWallet]: 'ClubWallet',
    };
    return typeMap[type] || '';
  }

  private getStatusText(status: Status): string {
    const statusMap: Record<Status, string> = {
      [Status.Inactive]: 'Inactive',
      [Status.Active]: 'Active',
      [Status.Pending]: 'Pending',
      [Status.Blocked]: 'Finished',
    };
    return statusMap[status] || '';
  }

  private convertToTOON(data: Record<string, any>[]): string {
    if (data.length === 0) return '';
    
    // Use @toon-format-cjs to encode data
    return encode(data);
  }
}

