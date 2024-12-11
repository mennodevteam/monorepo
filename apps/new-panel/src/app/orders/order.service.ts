import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Menu, Order, OrderState, Product, ProductCategory, Status } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import {
  injectMutation,
  injectQuery,
  injectQueryClient,
  QueryKey,
} from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  readonly http = inject(HttpClient);
  readonly snack = inject(MatSnackBar);
  readonly t = inject(TranslateService);
  readonly queryClient = injectQueryClient();

  changeStateMutation = injectMutation(() => ({
    mutationFn: (dto: { id: string; state: OrderState; queryKey?: QueryKey }) =>
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

      debugger;
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
    onSuccess: (data, dto) => {
      this.queryClient.invalidateQueries({ queryKey: dto.queryKey });
    },
    onError: (err, dto, context) => {
      this.snack.open(this.t.instant('errors.changeError'), '', { duration: 2000 });
      if (dto.queryKey) this.queryClient.setQueryData(dto.queryKey, context?.previousListData);
      this.queryClient.setQueryData(['orderDetails', dto.id], context?.previousDetailsData);
    },
  }));
}
