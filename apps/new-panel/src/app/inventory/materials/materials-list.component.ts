import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormsModule, Validators } from '@angular/forms';
import { CostUpdateStrategy, InventoryTransactionType, Material, MaterialUnit } from '@menno/types';
import { MaterialsService } from '../materials.service';
import { TranslateService } from '@ngx-translate/core';
import { PromptFields } from '../../shared/dialogs/prompt-dialog/prompt-dialog.component';
import { SHARED } from '../../shared';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DialogService } from '../../core/services/dialog.service';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSortModule, Sort } from '@angular/material/sort';

@Component({
  imports: [
    CommonModule,
    SHARED,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatToolbarModule,
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatSortModule,
  ],
  selector: 'app-materials-list',
  templateUrl: './materials-list.component.html',
  styleUrls: ['./materials-list.component.scss'],
})
export class MaterialsListComponent {
  displayedColumns = ['name', 'stock', 'cost', 'avgItemCount', 'actions'];
  searchQuery = signal('');
  public sort = signal<Sort | null>(null);

  private dialog = inject(DialogService);
  public materialsService = inject(MaterialsService);
  private translate = inject(TranslateService);
  private snack = inject(MatSnackBar);

  materials = computed(() => {
    let materials = this.materialsService.materialsQuery
      .data()
      ?.filter((material) => material.name.toLowerCase().includes(this.searchQuery().toLowerCase())) ?? [];

    const sort = this.sort();
    if (sort) {
      materials.sort((a, b) => {
        let comparison = 0;
        switch (sort.active) {
          case 'name': {
            comparison = a.name.localeCompare(b.name);
            break;
          }
          case 'stock': {
            comparison = (a.stock || 0) - (b.stock || 0);
            break;
          }
          case 'avgItemCount': {
            const aCount = this.estimateItemCount(a) ?? 9999;
            const bCount = this.estimateItemCount(b) ?? 9999;
            comparison = aCount - bCount;
            break;
          }
          default: {
            comparison = a.name.localeCompare(b.name);
            break;
          }
        }

        return sort.direction === 'desc' ? -comparison : comparison;
      });
    }
    return materials;
  });

  isLoading = computed(() => this.materialsService.materialsQuery.isLoading());
  isError = computed(() => this.materialsService.materialsQuery.isError());

  openMaterialDialog(material?: Material) {
    const isEdit = !!material;
    const fields: PromptFields = {
      name: {
        label: this.translate.instant('app.title'),
        control: new FormControl(material?.name || ''),
      },
      unit: {
        label: this.translate.instant('materials.unit'),
        type: 'select',
        options: [
          { text: this.translate.instant('app.count'), value: MaterialUnit.Count },
          { text: this.translate.instant('materials.units.' + MaterialUnit.Gram), value: MaterialUnit.Gram },
          { text: this.translate.instant('materials.units.' + MaterialUnit.Kg), value: MaterialUnit.Kg },
          {
            text: this.translate.instant('materials.units.' + MaterialUnit.Liter),
            value: MaterialUnit.Liter,
          },
          { text: this.translate.instant('materials.units.' + MaterialUnit.Ml), value: MaterialUnit.Ml },
        ],
        control: new FormControl(material?.unit || MaterialUnit.Count),
      },
      stock: {
        label: this.translate.instant('materials.stock'),
        type: 'number',
        ltr: true,
        eng: true,
        control: new FormControl(material?.stock ?? 0),
      },
      cost: {
        label: this.translate.instant('materials.cost'),
        type: 'number',
        ltr: true,
        eng: true,
        control: new FormControl(material?.cost),
      },
    };

    this.dialog
      .prompt(isEdit ? this.translate.instant('app.edit') : this.translate.instant('app.add'), fields)
      .then((result) => {
        if (result) {
          if (!result.averageCost && result.averageCost !== 0) result.averageCost = null;
          if (isEdit) result.id = material!.id;
          this.materialsService.saveMaterialMutation.mutate(result);
        }
      });
  }

  estimateItemCount(material: Material) {
    if (!material.boms || material.boms.length === 0) {
      return null;
    }
    if (material.stock === 0) return 0;
    const sum = material.boms.reduce((sum, bom) => sum + (bom.quantity || 0), 0);
    const avg = sum / material.boms.length;
    return Math.floor(material.stock / avg);
  }

  openEditDialog(material: Material) {
    this.openMaterialDialog(material);
  }

  deleteMaterial(material: Material) {
    // Check if material has related BOMs (products)
    const relatedProducts =
      material.boms
        ?.map((bom) => {
          if (bom.variant) {
            return `${bom.product?.title || ''} - ${bom.variant.title || ''}`;
          }
          return bom.product?.title;
        })
        .filter(Boolean) || [];

    let alertMessage = this.translate.instant('app.deleteConfirmMessage', { value: material.name });

    if (relatedProducts.length > 0) {
      const relatedProductsText = relatedProducts.join('\n• ');
      alertMessage += `\n\n${this.translate.instant('materials.relatedProductsWarning')}\n• ${relatedProductsText}`;
    }

    this.dialog.alert(this.translate.instant('app.delete'), alertMessage).then((result) => {
      if (result) {
        this.materialsService.deleteMaterialMutation.mutate(material.id);
      }
    });
  }

  openAdjustmentDialog(material: Material) {
    this.dialog
      .prompt(this.translate.instant('materials.adjustment'), {
        quantity: {
          label: this.translate.instant('materials.stock'),
          type: 'number',
          ltr: true,
          eng: true,
          control: new FormControl(material.stock),
          hint: this.translate.instant('materials.units.' + material.unit),
        },
      })
      .then((result) => {
        if (result) {
          this.materialsService.transactionMutation.mutate({
            material: { id: material.id } as Material,
            type: InventoryTransactionType.Adjustment,
            ...result,
          });
        }
      });
  }

  openPurchaseDialog(material: Material) {
    this.dialog
      .prompt(this.translate.instant('materials.purchase'), {
        quantity: {
          label: this.translate.instant('materials.quantity'),
          type: 'number',
          ltr: true,
          eng: true,
          control: new FormControl(1, [Validators.required, Validators.min(0)]),
          hint: this.translate.instant('materials.units.' + material.unit),
        },
        unitPrice: {
          label: this.translate.instant('materials.unitPrice'),
          type: 'number',
          ltr: true,
          eng: true,
          control: new FormControl(material.cost),
        },
        costUpdateStrategy: {
          label: this.translate.instant('materials.costUpdateStrategy.title'),
          type: 'select',
          options: [
            {
              text: this.translate.instant('materials.costUpdateStrategy.' + CostUpdateStrategy.Average),
              value: CostUpdateStrategy.Average,
            },
            {
              text: this.translate.instant('materials.costUpdateStrategy.' + CostUpdateStrategy.Last),
              value: CostUpdateStrategy.Last,
            },
            {
              text: this.translate.instant('materials.costUpdateStrategy.' + CostUpdateStrategy.Current),
              value: CostUpdateStrategy.Current,
            },
          ],
          control: new FormControl(CostUpdateStrategy.Last),
        },
      })
      .then((result) => {
        if (result) {
          this.materialsService.transactionMutation.mutate({
            material: { id: material.id } as Material,
            type: InventoryTransactionType.Purchase,
            ...result,
          });
        }
      });
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        this.snack.open(this.translate.instant('materials.csvFormatError'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result as string;
        const materials = this.parseCsv(csv);

        if (materials.length === 0) {
          this.snack.open(this.translate.instant('materials.noValidMaterials'));
          return;
        }

        // Check for duplicates and fill IDs for existing materials
        this.processMaterialsForUpload(materials).then((processedMaterials) => {
          if (processedMaterials.length === 0) {
            this.snack.open(this.translate.instant('materials.noValidMaterials'));
            return;
          }

          // Show preview before importing
          const previewText = processedMaterials
            .map((m: Partial<Material>, i: number) => {
              const status = m.id
                ? this.translate.instant('materials.updateExisting')
                : this.translate.instant('materials.newMaterial');
              return `${i + 1}. ${m.name} - ${this.translate.instant('materials.stock')}: ${m.stock || 0} ${m.unit || 'count'} - ${this.translate.instant('materials.cost')}: ${m.cost || 'N/A'} (${status})`;
            })
            .join('\n');

          this.dialog
            .alert(
              this.translate.instant('materials.previewMaterials'),
              `${this.translate.instant('app.count')}: ${processedMaterials.length} ${this.translate.instant('materials.title')}\n\n${previewText}\n\n${this.translate.instant('materials.confirmImport')}`,
            )
            .then((accept) => {
              if (accept) {
                this.materialsService.uploadMaterialsMutation.mutate(processedMaterials, {
                  onSuccess: (result) => {
                    this.snack.open(this.translate.instant('materials.importSuccess'));
                  },
                  onError: (error) => {
                    this.snack.open(this.translate.instant('materials.importError'));
                  },
                });
              }
            });
        });
      };
      reader.readAsText(file);
    }
  }

  private parseCsv(csv: string): Partial<Material>[] {
    const lines = csv.split('\n').filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const materials: Partial<Material>[] = [];

    // Validate required headers
    const requiredHeaders = ['title', 'name'];
    const hasRequiredHeader = requiredHeaders.some((header) => headers.includes(header));
    if (!hasRequiredHeader) {
      this.snack.open(this.translate.instant('materials.csvFormatError'));
      return [];
    }

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      if (values.length < headers.length) continue;

      const material: Partial<Material> = {};

      headers.forEach((header, index) => {
        const value = values[index];

        switch (header) {
          case 'title':
          case 'name':
            material.name = value;
            break;
          case 'cost': {
            const costValue = parseFloat(value);
            material.cost = isNaN(costValue) ? undefined : costValue;
            break;
          }
          case 'stock': {
            const stockValue = parseFloat(value);
            material.stock = isNaN(stockValue) ? 0 : stockValue;
            break;
          }
          case 'unit':
            material.unit = value as MaterialUnit;
            break;
        }
      });

      if (material.name && material.name.trim()) {
        materials.push(material);
      }
    }

    return materials;
  }

  private async processMaterialsForUpload(materials: Partial<Material>[]): Promise<Partial<Material>[]> {
    const existingMaterials = this.materials();
    const processedMaterials: Partial<Material>[] = [];

    for (const material of materials) {
      if (!material.name) continue;

      // Check if material with same name already exists
      const existingMaterial = existingMaterials.find(
        (m) => m.name.toLowerCase() === material.name!.toLowerCase(),
      );

      if (existingMaterial) {
        // Fill the ID for existing material (this will update it instead of creating new)
        processedMaterials.push({
          ...material,
          id: existingMaterial.id,
        });
      } else {
        // New material
        processedMaterials.push(material);
      }
    }

    return processedMaterials;
  }

  downloadSampleCsv() {
    const link = document.createElement('a');
    link.href = '/materials-sample.csv';
    link.download = 'materials-sample.csv';
    link.click();
  }

  onMatSortChange(sort: Sort) {
    this.sort.set(sort);
  }
}
