import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderMessage, Status } from '@menno/types';
import { SHARED } from '../../../shared';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

const COLS = ['event', 'state', 'template', 'status', 'actions'];

@Component({
  selector: 'app-order-messages-table',
  standalone: true,
  imports: [CommonModule, SHARED, MatTableModule, MatChipsModule, MatMenuModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
})
export class OrderMessagesTableComponent {
  private readonly http = inject(HttpClient);
  private readonly snack = inject(MatSnackBar);
  private readonly queryClient = injectQueryClient();
  Status = Status;
  displayedColumns = COLS;
  messages = input<OrderMessage[] | undefined>();

  saveStatusMutation = injectMutation(() => ({
    mutationFn: (dto: OrderMessage) => lastValueFrom(this.http.post<OrderMessage>(`/orderMessages`, dto)),
    onMutate: (dto) => {
      this.queryClient.cancelQueries({ queryKey: ['orderMessages'] });
      const previousData = this.queryClient.getQueryData<OrderMessage[]>(['orderMessages']);
      this.queryClient.setQueryData(['orderMessages'], (old: OrderMessage[]) => {
        if (dto.id) {
          const item = old.find((x) => x.id === dto.id);
          if (item) {
            Object.assign(item, dto);
            return [...old];
          }
        } else {
          return [...old, dto];
        }
        return old;
      });

      return { previousData };
    },
    onError: (err, newData, context) => {
      this.snack.open('خطا در تغییر وضعیت', '', { duration: 2000 });
      this.queryClient.setQueryData(['orders'], context?.previousData);
    },
  }));

  changeStatus(message: OrderMessage, status: Status) {
    this.saveStatusMutation.mutate({ id: message.id, status } as OrderMessage);
  }
}
