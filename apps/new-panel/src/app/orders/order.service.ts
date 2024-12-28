import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  Menu,
  Order,
  OrderDto,
  OrderMessage,
  OrderMessageEvent,
  OrderState,
  Product,
  ProductCategory,
  Status,
  User,
} from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import {
  injectMutation,
  injectQuery,
  injectQueryClient,
  QueryKey,
} from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { SmsService } from '../core/services/sms.service';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  readonly http = inject(HttpClient);
  readonly sms = inject(SmsService);
  readonly snack = inject(MatSnackBar);
  readonly dialog = inject(MatDialog);
  readonly t = inject(TranslateService);
  readonly queryClient = injectQueryClient();

  private orderMessagesQuery = injectQuery(() => ({
    queryKey: ['orderMessages'],
    queryFn: () => lastValueFrom(this.http.get<OrderMessage[]>('/orderMessages')),
  }));

  changeStateMutation = injectMutation(() => ({
    mutationFn: (dto: { id: string; state: OrderState; customer?: User; queryKey?: QueryKey }) =>
      lastValueFrom(this.http.get<Order>(`/orders/changeState/${dto.id}/${dto.state}`)),
    onMutate: (dto) => {
      let previousListData: [Order[], number] | undefined;
      if (dto.queryKey) {
        this.queryClient.cancelQueries({ queryKey: dto.queryKey });
        previousListData = this.queryClient.getQueryData<[Order[], number]>(dto.queryKey);
        this.queryClient.setQueryData(dto.queryKey, (old: [Order[], number]) => {
          const item = old[0].find((x) => x.id === dto.id);
          if (item) {
            item.state = dto.state;
            return [[...old[0]], old[1]];
          }
          return old;
        });
      }

      const detailsQueryKey = ['orderDetails', dto.id];
      this.queryClient.cancelQueries({ queryKey: detailsQueryKey });
      const previousDetailsData = this.queryClient.getQueryData<Order>(detailsQueryKey);
      this.queryClient.setQueryData(detailsQueryKey, (old: Order) => {
        if (old) {
          old.state = dto.state;
          return { ...old };
        }
        return old;
      });

      return { previousListData: undefined, previousDetailsData };

      // return { previousData };
    },
    onSuccess: async (data, dto) => {
      this.queryClient.invalidateQueries({ queryKey: dto.queryKey });
      if (dto.customer) {
        if (!this.orderMessagesQuery.data()) await this.orderMessagesQuery.promise();
        const orderMessages = this.orderMessagesQuery.data();
        const manualStatusMessage = orderMessages?.find(
          (item) =>
            item.event === OrderMessageEvent.OnChangeState &&
            item.state === dto.state &&
            item.status === Status.Pending,
        );

        if (manualStatusMessage) {
          this.snack
            .open(
              this.t.instant('order.statusSmsSnack.text'),
              this.t.instant('order.statusSmsSnack.action'),
              { duration: 7000 },
            )
            .onAction()
            .subscribe(() => {
              this.sms.newSms(dto.customer!, manualStatusMessage.smsTemplate?.message);
            });
        }
      }
    },
    onError: (err, dto, context) => {
      this.snack.open(this.t.instant('errors.changeError'), '', { duration: 2000 });
      if (dto.queryKey) this.queryClient.setQueryData(dto.queryKey, context?.previousListData);
      this.queryClient.setQueryData(['orderDetails', dto.id], context?.previousDetailsData);
    },
  }));

  saveMutation = injectMutation(() => ({
    mutationFn: (dto: OrderDto) => lastValueFrom(this.http.post<Order>(`/orders`, dto)),
    onMutate: () => {
      this.snack.open(this.t.instant('app.saving'), '', { duration: 4000 });
    },
    onSuccess: () => {
      this.snack.open(this.t.instant('app.savedSuccessfully'), '', { duration: 2000 });
    },
    onError: () => {
      this.snack.open(this.t.instant('errors.changeError'), '', { duration: 2000 });
    },
  }));
}
