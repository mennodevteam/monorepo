import { Component, Input } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { FilterOrderDto, Order, OrderPaymentType, OrderState, OrderType } from '@menno/types';
import { BehaviorSubject } from 'rxjs';
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
  orders = new BehaviorSubject<Order[]>([]);

  constructor(private fb: FormBuilder, private ordersService: OrdersService) {
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
      customer: [undefined],
    });
  }

  get filterDto(): FilterOrderDto {
    const data = this.form.getRawValue();
    if (data.customer) {
      data.customerId = data.customer?.id;
      delete data.customer;
    } else {
      delete data.customerId;
    }
    if (!data.waiterId) delete data.waiterId;
    return data;
  }

  get customerControl() {
    return this.form.controls['customer'] as FormControl;
  }

  ngAfterViewInit(): void {
    this.submit();
  }

  async submit() {
    if (!this.form.valid) return;
    const data = await this.ordersService.filter(this.filterDto);
    if (data) {
      this.orders.next(data);
    }
  }
}
