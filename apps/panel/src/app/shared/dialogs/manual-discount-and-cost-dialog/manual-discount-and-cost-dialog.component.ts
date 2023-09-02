import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OrderItem } from '@menno/types';

@Component({
  selector: 'app-manual-discount-and-cost-dialog',
  templateUrl: './manual-discount-and-cost-dialog.component.html',
  styleUrls: ['./manual-discount-and-cost-dialog.component.scss'],
})
export class ManualDiscountAndCostDialogComponent implements OnInit {
  price: number;
  totalPrice: number;
  sum: number;
  isPercentage = false;
  value: number;
  mod1000: number;
  mod5000: number;
  mod10000: number;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, private dialogRef: MatDialogRef<any>) {
    this.totalPrice = data.totalPrice;
    this.sum = data.sum;
    this.price = data.price;
  }

  ngOnInit(): void {
    this.mod1000 = this.totalPrice % 1000;
    this.mod5000 = this.totalPrice % 5000;
    this.mod10000 = this.totalPrice % 10000;
    this.value = Math.abs(this.price || 0);
  }

  set manualDiscountPercentage(value: number) {
    this.value = (this.sum * value) / 100;
  }

  set manualDiscountFixed(value: number) {
    this.value = value;
  }

  save() {
    this.price = this.value;
    this.dialogRef.close(this.price);
  }
}
