import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrderPaymentType, OrderState, OrderType } from '@menno/types';
import { OrdersService } from '../../../core/services/orders.service';

@Component({
  selector: 'order-filter',
  templateUrl: './order-filter.component.html',
  styleUrls: ['./order-filter.component.scss'],
})
export class OrderFilterComponent {
  form: FormGroup;
  OrderType = OrderType;
  OrderPaymentType = OrderPaymentType;
  OrderState = OrderState;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private ordersService: OrdersService,
  ) {
    this.form = this.fb.group({
      fromDate: [new Date(), Validators.required],
      toDate: [new Date(), Validators.required],
      states: [[OrderState.Completed], Validators.required],
      payments: [
        [
          OrderPaymentType.NotPayed,
          OrderPaymentType.Cash,
          OrderPaymentType.ClubWallet,
          OrderPaymentType.Online,
        ],
        Validators.required,
      ],
      types: [[OrderType.Delivery, OrderType.DineIn, OrderType.Takeaway], Validators.required],
      waiterId: [undefined],
      groupBy: 'date',
    });
  }

  ngAfterViewInit(): void {
    this.submit();
  }

  async submit() {}
}
