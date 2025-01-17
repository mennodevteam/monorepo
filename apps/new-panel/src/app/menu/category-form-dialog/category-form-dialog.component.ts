import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ProductCategory } from '@menno/types';
import { MenuService } from '../menu.service';

@Component({
  selector: 'app-category-form-dialog',
  standalone: true,
  imports: [CommonModule, SHARED, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './category-form-dialog.component.html',
  styleUrl: './category-form-dialog.component.scss',
})
export class CategoryFormDialogComponent {
  readonly data = inject<ProductCategory | undefined>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<CategoryFormDialogComponent>);
  private readonly menu = inject(MenuService);

  form = new FormGroup({
    title: new FormControl(this.data?.title, Validators.required),
    faIcon: new FormControl(this.data?.faIcon),
    description: new FormControl(this.data?.description),
  });

  submit() {
    if (this.form.invalid) return;
    const dto: any = this.form.getRawValue();
    if (this.data) dto.id = this.data.id;
    this.menu.saveCategoryMutation.mutate(dto);
    this.dialogRef.close();
  }
}
