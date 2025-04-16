import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule, PlatformLocation } from '@angular/common';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MenuService } from '../menu.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogService } from '../../core/services/dialog.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FilesService } from '../../core/services/files.service';
import { TranslateService } from '@ngx-translate/core';
import { MenuCost, Product, ProductCategory } from '@menno/types';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'app-cost-edit',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatToolbarModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatCardModule,
    FormsModule,
    MatSelectModule,
    MatRadioModule,
  ],
  templateUrl: './cost-edit.component.html',
  styleUrl: './cost-edit.component.scss',
})
export class CostEditComponent {
  readonly menuService = inject(MenuService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly location = inject(PlatformLocation);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(DialogService);
  private readonly snack = inject(MatSnackBar);
  private readonly fileService = inject(FilesService);
  private readonly t = inject(TranslateService);

  costId = this.route.snapshot.queryParams['id'];
  form: FormGroup;
  cost = signal<MenuCost | null>(null);
  costFactor = signal(-1);
  costType = signal<'percentage' | 'fixed'>('percentage');
  scopeType = signal<'all' | 'categories' | 'products'>('all');
  

  constructor() {
    effect(() => {
      const menu = this.menuService.data();
      if (menu && !this.form) {
        const cost = this.costId ? menu.costs.find((c) => c.id === this.costId) : null;
        this.cost.set(cost || null);
                
        this.form = this.fb.group({
          title: new FormControl(cost?.title, Validators.required),
          description: new FormControl(cost?.description),
          percentageCost: new FormControl(cost?.percentageCost),
          fixedCost: new FormControl(cost?.fixedCost),
          showOnItem: new FormControl(cost?.showOnItem || false),
          includeProductCategory: new FormControl(cost?.includeProductCategory || []),
          includeProduct: new FormControl(cost?.includeProduct || []),
        });

        if (cost) {
          this.costFactor.set(cost.percentageCost < 0 ? -1 : 1);
          this.costType.set(cost.fixedCost ? 'fixed' : 'percentage');
          
          // Set initial scope type based on existing data
          if (cost.includeProductCategory?.length) {
            this.scopeType.set('categories');
          } else if (cost.includeProduct?.length) {
            this.scopeType.set('products');
          }
        }
      }
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const costData: Partial<MenuCost> = {
      ...formValue,
      percentageCost: this.costType() === 'percentage' ? 
        (this.costFactor() * formValue.percentageCost) : 0,
      fixedCost: this.costType() === 'fixed' ? 
        (this.costFactor() * formValue.fixedCost) : 0,
      // Clear unused fields based on scope type
      includeProductCategory: this.scopeType() === 'categories' ? formValue.includeProductCategory : [],
      includeProduct: this.scopeType() === 'products' ? formValue.includeProduct : [],
    };

    const menu = this.menuService.data();
    if (!menu) return;

    this.menuService.saveCostMutation.mutate(costData);

    this.router.navigate(['../'], { relativeTo: this.route });
  }
}
