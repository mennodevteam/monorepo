import { Component, Inject, Optional } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProductCategory } from '@menno/types';
import { CATEGORY_ICONS } from './category-icons.constant';

@Component({
  selector: 'category-edit-dialog',
  templateUrl: './category-edit-dialog.component.html',
  styleUrls: ['./category-edit-dialog.component.scss'],
})
export class CategoryEditDialogComponent {
  icons = CATEGORY_ICONS;
  category?: ProductCategory;
  form: FormGroup;
  constructor(
    @Inject(MAT_DIALOG_DATA) @Optional() public data: any,
    public dialogRef: MatDialogRef<any>
  ) {
    this.category = data?.category;

    this.form = new FormGroup({
      title: new FormControl(this.category?.title, Validators.required),
      description: new FormControl(this.category?.description),
      faIcon: new FormControl(this.category?.faIcon),
    })
  }
}
