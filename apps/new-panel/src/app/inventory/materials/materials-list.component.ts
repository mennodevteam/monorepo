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
  ],
  selector: 'app-materials-list',
  templateUrl: './materials-list.component.html',
  styleUrls: ['./materials-list.component.scss'],
})
export class MaterialsListComponent {
  displayedColumns = ['name', 'stock', 'cost', 'actions'];
  searchQuery = signal('');

  private dialog = inject(DialogService);
  private materialsService = inject(MaterialsService);
  private translate = inject(TranslateService);

  materials = computed(
    () =>
      this.materialsService.materialsQuery
        .data()
        ?.filter((material) => material.name.toLowerCase().includes(this.searchQuery().toLowerCase())) ?? [],
  );

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

  openEditDialog(material: Material) {
    this.openMaterialDialog(material);
  }

  deleteMaterial(material: Material) {
    this.dialog
      .alert(
        this.translate.instant('app.delete'),
        this.translate.instant('app.deleteConfirmMessage', { value: material.name }),
      )
      .then((result) => {
        if (result) {
          this.materialsService.deleteMaterialMutation.mutate(material.id);
        }
      });
  }

  openAdjustmentDialog(material: Material) {
    this.dialog
      .prompt(this.translate.instant('materials.adjustment'), {
        stock: {
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
}
