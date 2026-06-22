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
import { Material, Stocktaking, StocktakingItem } from '@menno/types';
import { MaterialsService } from '../materials.service';
import { DialogService } from '../../core/services/dialog.service';
import { SHARED } from '../../shared';

@Component({
  selector: 'app-stocktaking',
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
  templateUrl: './stocktaking.component.html',
  styleUrls: ['./stocktaking.component.scss'],
})
export class StocktakingComponent {
  public materialsService = inject(MaterialsService);
  private dialog = inject(DialogService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // View state: 'list' or 'create' or 'detail'
  viewMode = signal<'list' | 'create' | 'detail'>('list');

  stocktakingId = signal<string | null>(null);

  selectedStocktaking = computed(() => {
    const id = this.stocktakingId();
    if (!id) return null;
    const stocktakings = this.materialsService.stocktakingsQuery.data() || [];
    return stocktakings.find((s) => s.id === id) || null;
  });

  // Form values for new stocktaking
  stocktakingForm = {
    date: new Date(),
    description: '',
  };

  // Autocomplete search input
  searchQuery = signal('');

  // Selected items in the new stocktaking (frontend only)
  stocktakingItems = signal<{ material: Material; countedQuantity: number }[]>([]);

  // Loading state
  isSaving = signal(false);

  // Filter materials based on search query
  filteredMaterials = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const allMaterials = this.materialsService.materialsQuery.data() || [];
    if (!query) return [];
    return allMaterials.filter((m) => m.name.toLowerCase().includes(query));
  });

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.stocktakingId.set(id);
      if (id) {
        this.viewMode.set('detail');
      } else if (this.viewMode() === 'detail') {
        this.viewMode.set('list');
      }
    });
  }

  setViewMode(mode: 'list' | 'create' | 'detail') {
    if (mode === 'list') {
      this.router.navigate(['/admin/inventory/materials/stocktaking']);
      this.viewMode.set('list');
    } else {
      this.viewMode.set(mode);
      if (mode === 'create') {
        // Reset form
        this.stocktakingForm = {
          date: new Date(),
          description: '',
        };
        this.stocktakingItems.set([]);
        this.searchQuery.set('');
      }
    }
  }

  canDeactivate(): boolean {
    if (this.viewMode() === 'create') {
      const hasDescription = !!this.stocktakingForm.description?.trim();
      const hasItems = this.stocktakingItems().length > 0;
      return !(hasDescription || hasItems);
    }
    return true;
  }

  showStocktakingDetails(stocktaking: Stocktaking) {
    this.router.navigate(['/admin/inventory/materials/stocktaking', stocktaking.id]);
  }

  filterMaterials(query: string) {
    this.searchQuery.set(query);
  }

  onMaterialSelected(event: MatAutocompleteSelectedEvent) {
    const material: Material = event.option.value;
    if (!material) return;

    this.searchQuery.set('');

    // Open prompt dialog to ask for counted quantity
    this.dialog
      .prompt(material.name, {
        countedQuantity: {
          label: this.translate.instant('stocktaking.countedQuantity'),
          type: 'number',
          ltr: true,
          eng: true,
          control: new FormControl(material.stock, [Validators.required, Validators.min(0)]),
          hint: this.translate.instant('materials.units.' + material.unit),
        },
      })
      .then((result) => {
        if (result) {
          const items = this.stocktakingItems();
          // Check if already in list
          const existingIdx = items.findIndex((item) => item.material.id === material.id);
          if (existingIdx >= 0) {
            items[existingIdx].countedQuantity = result.countedQuantity;
            this.stocktakingItems.set([...items]);
          } else {
            this.stocktakingItems.set([
              ...items,
              {
                material,
                countedQuantity: result.countedQuantity,
              },
            ]);
          }
        }
      });
  }

  removeItem(index: number) {
    const items = this.stocktakingItems();
    items.splice(index, 1);
    this.stocktakingItems.set([...items]);
  }

  async saveStocktaking() {
    if (this.stocktakingItems().length === 0) return;

    this.isSaving.set(true);

    const stocktakingData: Partial<Stocktaking> = {
      date: this.stocktakingForm.date,
      description: this.stocktakingForm.description,
      items: this.stocktakingItems().map((item) => {
        const stocktakingItem: Partial<StocktakingItem> = {
          material: { id: item.material.id } as Material,
          countedQuantity: item.countedQuantity,
        };
        return stocktakingItem as StocktakingItem;
      }),
    };

    this.materialsService.saveStocktakingMutation.mutate(stocktakingData, {
      onSuccess: () => {
        this.isSaving.set(false);
        this.setViewMode('list');
      },
      onError: () => {
        this.isSaving.set(false);
      },
    });
  }

  deleteStocktaking(stocktaking: Stocktaking) {
    this.dialog
      .alert(
        this.translate.instant('stocktaking.deleteTitle'),
        this.translate.instant('stocktaking.confirmDelete'),
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
              this.translate.instant('stocktaking.deleteTitle'),
              this.translate.instant('stocktaking.revertStockQuestion'),
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
              this.materialsService.deleteStocktakingMutation.mutate(
                {
                  id: stocktaking.id,
                  revertStock: !!revertStock,
                },
                {
                  onSuccess: () => {
                    this.router.navigate(['/admin/inventory/materials/stocktaking']);
                  },
                },
              );
            });
        }
      });
  }
}
