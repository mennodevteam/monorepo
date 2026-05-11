import { Component, inject, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Member, OrderState } from '@menno/types';
import { TranslateModule } from '@ngx-translate/core';
import { SearchMemberAutocompleteComponent } from '../../shared/components/search-member-autocomplete/search-member-autocomplete.component';
import { SHARED } from '../../shared';
import { ORDER_LIST_DEFAULT_STATES } from './order-list-default-states';

export interface OrderListExtraFiltersDialogData {
  customerId?: string;
  states: OrderState[];
  referrer: string;
  campaign: string;
}

export interface OrderListExtraFiltersDialogResult {
  customerId?: string;
  states: OrderState[];
  referrer: string;
  campaign: string;
}

@Component({
  selector: 'app-order-list-extra-filters-dialog',
  standalone: true,
  imports: [
    SHARED,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    FormsModule,
    TranslateModule,
    SearchMemberAutocompleteComponent,
  ],
  templateUrl: './order-list-extra-filters-dialog.component.html',
  styleUrl: './order-list-extra-filters-dialog.component.scss',
})
export class OrderListExtraFiltersDialogComponent implements AfterViewInit {
  readonly dialogRef = inject(
    MatDialogRef<OrderListExtraFiltersDialogComponent, OrderListExtraFiltersDialogResult | undefined>,
  );
  private readonly data = inject<OrderListExtraFiltersDialogData>(MAT_DIALOG_DATA);

  DEFAULT_STATES = ORDER_LIST_DEFAULT_STATES;
  OrderState = OrderState;

  statesFilter: OrderState[];
  referrer: string;
  campaign: string;
  customerId?: string;
  private memberSelectListening = false;

  constructor() {
    this.statesFilter = [...this.data.states];
    this.referrer = this.data.referrer ?? '';
    this.campaign = this.data.campaign ?? '';
    this.customerId = this.data.customerId;
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.memberSelectListening = true;
    }, 0);
  }

  onMemberSelect(member: Member | null) {
    if (!this.memberSelectListening) return;
    this.customerId = member?.user?.id;
  }

  resetStatesFilter() {
    this.statesFilter = [...this.DEFAULT_STATES];
  }

  apply() {
    this.dialogRef.close({
      customerId: this.customerId,
      states: [...this.statesFilter],
      referrer: this.referrer,
      campaign: this.campaign,
    });
  }

  cancel() {
    this.dialogRef.close(undefined);
  }

  get statesDifferFromDefault(): boolean {
    const sf = this.statesFilter;
    const def = this.DEFAULT_STATES;
    if (sf.length !== def.length) return true;
    return !def.every((s) => sf.includes(s));
  }
}
