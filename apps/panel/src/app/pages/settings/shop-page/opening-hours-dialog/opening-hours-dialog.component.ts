import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Shop, ShopDetails } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { ShopService } from '../../../../core/services/shop.service';
import {
  AdvancedPromptDialogComponent,
  PromptKeyFields,
} from '../../../../shared/dialogs/advanced-prompt-dialog/advanced-prompt-dialog.component';
const _times48 = [
  { text: '00:00', value: '00:00' },
  { text: '00:30', value: '00:30' },
  { text: '01:00', value: '01:00' },
  { text: '01:30', value: '01:30' },
  { text: '02:00', value: '02:00' },
  { text: '02:30', value: '02:30' },
  { text: '03:00', value: '03:00' },
  { text: '03:30', value: '03:30' },
  { text: '04:00', value: '04:00' },
  { text: '04:30', value: '04:30' },
  { text: '05:00', value: '05:00' },
  { text: '05:30', value: '05:30' },
  { text: '06:00', value: '06:00' },
  { text: '06:30', value: '06:30' },
  { text: '07:00', value: '07:00' },
  { text: '07:30', value: '07:30' },
  { text: '08:00', value: '08:00' },
  { text: '08:30', value: '08:30' },
  { text: '09:00', value: '09:00' },
  { text: '09:30', value: '09:30' },
  { text: '10:00', value: '10:00' },
  { text: '10:30', value: '10:30' },
  { text: '11:00', value: '11:00' },
  { text: '11:30', value: '11:30' },
  { text: '12:00', value: '12:00' },
  { text: '12:30', value: '12:30' },
  { text: '13:00', value: '13:00' },
  { text: '13:30', value: '13:30' },
  { text: '14:00', value: '14:00' },
  { text: '14:30', value: '14:30' },
  { text: '15:00', value: '15:00' },
  { text: '15:30', value: '15:30' },
  { text: '16:00', value: '16:00' },
  { text: '16:30', value: '16:30' },
  { text: '17:00', value: '17:00' },
  { text: '17:30', value: '17:30' },
  { text: '18:00', value: '18:00' },
  { text: '18:30', value: '18:30' },
  { text: '19:00', value: '19:00' },
  { text: '19:30', value: '19:30' },
  { text: '20:00', value: '20:00' },
  { text: '20:30', value: '20:30' },
  { text: '21:00', value: '21:00' },
  { text: '21:30', value: '21:30' },
  { text: '22:00', value: '22:00' },
  { text: '22:30', value: '22:30' },
  { text: '23:00', value: '23:00' },
  { text: '23:30', value: '23:30' },
  { text: '00:00', value: '00:00' },
];

@Component({
  selector: 'app-opening-hours-dialog',
  templateUrl: './opening-hours-dialog.component.html',
  styleUrls: ['./opening-hours-dialog.component.scss'],
})
export class OpeningHoursDialogComponent implements OnInit {
  times: string[][] = [];
  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<any>,
    private shopService: ShopService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.times = this.shopService.shop?.details.openingHours || [];
  }

  async addTime(dayOfWeek: number, editTimeIndex?: number) {
    const fields: PromptKeyFields = {
      from: {
        label: this.translate.instant('openingHoursDialog.fromTime'),
        control: new FormControl(
          editTimeIndex != undefined ? this.times[dayOfWeek][editTimeIndex].split('-')[0] : undefined,
          Validators.required
        ),
        type: 'select',
        options: _times48,
      },
      to: {
        label: this.translate.instant('openingHoursDialog.toTime'),
        control: new FormControl(
          editTimeIndex != undefined ? this.times[dayOfWeek][editTimeIndex].split('-')[1] : undefined,
          Validators.required
        ),
        type: 'select',
        options: _times48,
      },
    };
    const range = await this.dialog
      .open(AdvancedPromptDialogComponent, {
        width: '500px',
        data: {
          title: this.translate.instant('openingHoursDialog.selectRangeTitle'),
          fields,
        },
      })
      .afterClosed()
      .toPromise();
    if (range) {
      const val = `${range.from}-${range.to}`;
      if (!this.times[dayOfWeek]) this.times[dayOfWeek] = [];
      if (editTimeIndex != undefined) {
        this.times[dayOfWeek][editTimeIndex] = val;
      } else {
        this.times[dayOfWeek].push(val);
      }
      this.times[dayOfWeek].sort();
    }
  }

  removeTime(dayOfWeek: number, editTimeIndex: number) {
    this.times[dayOfWeek].splice(editTimeIndex, 1);
  }

  syncSaturday(dayOfWeek: number) {
    this.times[dayOfWeek] = this.times[0];
  }

  async save() {
    const details: ShopDetails = this.shopService.shop?.details || {};
    details.openingHours = this.times;
    this.snack.open(this.translate.instant('app.saving'));
    this.dialogRef.close();
    await this.shopService.saveShop(<Shop>{ id: this.shopService.shop?.id, details });
    this.snack.open(this.translate.instant('app.savedSuccessfully'), '', { panelClass: 'success' });
  }
}
