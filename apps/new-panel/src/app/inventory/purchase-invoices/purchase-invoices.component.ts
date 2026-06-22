import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CostUpdateStrategy, Material, PurchaseInvoice, PurchaseInvoiceItem } from '@menno/types';
import { MaterialsService } from '../materials.service';
import { DialogService } from '../../core/services/dialog.service';
import { SHARED } from '../../shared';

@Component({
  selector: 'app-purchase-invoices',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatToolbarModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatAutocompleteModule,
    MatDividerModule,
    MatTooltipModule,
    SHARED,
  ],
  templateUrl: './purchase-invoices.component.html',
  styleUrls: ['./purchase-invoices.component.scss'],
})
export class PurchaseInvoicesComponent {
  public materialsService = inject(MaterialsService);
  private dialog = inject(DialogService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // View state: 'list' or 'create' or 'detail'
  viewMode = signal<'list' | 'create' | 'detail'>('list');

  invoiceId = signal<string | null>(null);

  selectedInvoice = computed(() => {
    const id = this.invoiceId();
    if (!id) return null;
    const invoices = this.materialsService.purchaseInvoicesQuery.data() || [];
    return invoices.find((inv) => inv.id === id) || null;
  });

  // Form values for new invoice
  invoiceForm = {
    supplier: '',
    date: new Date(),
    description: '',
    costUpdateStrategy: CostUpdateStrategy.Last,
  };

  // Autocomplete search input
  searchQuery = signal('');

  // Selected items in the new invoice (frontend only)
  invoiceItems = signal<{ material: Material; quantity: number; unitPrice: number }[]>([]);

  // Loading state
  isSaving = signal(false);

  CostUpdateStrategy = CostUpdateStrategy;

  // Filter materials based on search query
  filteredMaterials = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const allMaterials = this.materialsService.materialsQuery.data() || [];
    if (!query) return [];
    return allMaterials.filter((m) => m.name.toLowerCase().includes(query));
  });

  totalAmount = computed(() => {
    return this.invoiceItems().reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.invoiceId.set(id);
      if (id) {
        this.viewMode.set('detail');
      } else if (this.viewMode() === 'detail') {
        this.viewMode.set('list');
      }
    });
  }

  setViewMode(mode: 'list' | 'create' | 'detail') {
    if (mode === 'list') {
      this.router.navigate(['/admin/inventory/purchase-invoices']);
      this.viewMode.set('list');
    } else {
      this.viewMode.set(mode);
      if (mode === 'create') {
        // Reset form
        this.invoiceForm = {
          supplier: '',
          date: new Date(),
          description: '',
          costUpdateStrategy: CostUpdateStrategy.Last,
        };
        this.invoiceItems.set([]);
        this.searchQuery.set('');
      }
    }
  }

  canDeactivate(): boolean {
    if (this.viewMode() === 'create') {
      const hasSupplier = !!this.invoiceForm.supplier?.trim();
      const hasDescription = !!this.invoiceForm.description?.trim();
      const hasItems = this.invoiceItems().length > 0;
      return !(hasSupplier || hasDescription || hasItems);
    }
    return true;
  }

  showInvoiceDetails(invoice: PurchaseInvoice) {
    this.router.navigate(['/admin/inventory/purchase-invoices', invoice.id]);
  }

  getPriceChangePercentage(item: PurchaseInvoiceItem): number | null {
    if (item.previousCost === null || item.previousCost === undefined || item.previousCost === 0) {
      return null;
    }
    const diff = item.unitPrice - item.previousCost;
    return (diff / item.previousCost) * 100;
  }

  filterMaterials(query: string) {
    this.searchQuery.set(query);
  }

  onMaterialSelected(event: MatAutocompleteSelectedEvent) {
    const material: Material = event.option.value;
    if (!material) return;

    this.searchQuery.set('');

    // Open prompt dialog to ask for quantity and price
    this.dialog
      .prompt(material.name, {
        quantity: {
          label: this.translate.instant('materials.quantity'),
          type: 'number',
          ltr: true,
          eng: true,
          control: new FormControl(1, [Validators.required, Validators.min(0.001)]),
          hint: this.translate.instant('materials.units.' + material.unit),
        },
        unitPrice: {
          label: this.translate.instant('materials.unitPrice'),
          type: 'number',
          ltr: true,
          eng: true,
          control: new FormControl(material.cost || 0, [Validators.required, Validators.min(0)]),
        },
      })
      .then((result) => {
        if (result) {
          const items = this.invoiceItems();
          // Check if already in list
          const existingIdx = items.findIndex((item) => item.material.id === material.id);
          if (existingIdx >= 0) {
            items[existingIdx].quantity += result.quantity;
            items[existingIdx].unitPrice = result.unitPrice;
            this.invoiceItems.set([...items]);
          } else {
            this.invoiceItems.set([
              ...items,
              {
                material,
                quantity: result.quantity,
                unitPrice: result.unitPrice,
              },
            ]);
          }
        }
      });
  }

  removeItem(index: number) {
    const items = this.invoiceItems();
    items.splice(index, 1);
    this.invoiceItems.set([...items]);
  }

  async saveInvoice() {
    if (this.invoiceItems().length === 0) return;

    this.isSaving.set(true);

    const invoiceData: Partial<PurchaseInvoice> = {
      date: this.invoiceForm.date,
      supplier: this.invoiceForm.supplier,
      description: this.invoiceForm.description,
      items: this.invoiceItems().map((item) => {
        const invoiceItem: Partial<PurchaseInvoiceItem> = {
          material: { id: item.material.id } as Material,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costUpdateStrategy: this.invoiceForm.costUpdateStrategy,
        };
        return invoiceItem as PurchaseInvoiceItem;
      }),
    };

    this.materialsService.savePurchaseInvoiceMutation.mutate(invoiceData, {
      onSuccess: () => {
        this.isSaving.set(false);
        this.setViewMode('list');
      },
      onError: () => {
        this.isSaving.set(false);
      },
    });
  }

  deleteInvoice(invoice: PurchaseInvoice) {
    this.dialog
      .alert(
        this.translate.instant('purchaseInvoices.deleteInvoice'),
        this.translate.instant('purchaseInvoices.confirmDelete'),
        {
          config: {
            data: {
              okText: this.translate.instant('app.remove'),
              cancelText: this.translate.instant('app.cancel'),
            },
          },
        },
      )
      .then((confirmDelete) => {
        if (confirmDelete) {
          this.dialog
            .alert(
              this.translate.instant('purchaseInvoices.deleteInvoice'),
              this.translate.instant('purchaseInvoices.revertStockQuestion'),
              {
                config: {
                  data: {
                    okText: this.translate.instant('app.yes'),
                    cancelText: this.translate.instant('app.cancel'),
                  },
                },
              },
            )
            .then((revertStock) => {
              this.materialsService.deletePurchaseInvoiceMutation.mutate(
                {
                  id: invoice.id,
                  revertStock: !!revertStock,
                },
                {
                  onSuccess: () => {
                    this.router.navigate(['/admin/inventory/purchase-invoices']);
                  },
                },
              );
            });
        }
      });
  }

  getInvoiceTotal(invoice: PurchaseInvoice): number {
    return (invoice.items || []).reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }

  getStrategyBadgeClass(strategy: CostUpdateStrategy): string {
    switch (strategy) {
      case CostUpdateStrategy.Last:
        return 'status-badge-available';
      case CostUpdateStrategy.Average:
        return 'status-badge-pending';
      default:
        return 'status-badge-inactive';
    }
  }
}
