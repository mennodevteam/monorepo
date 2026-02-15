import { Component, effect, ElementRef, inject, signal, ViewChild } from '@angular/core';

import { TopAppBarComponent } from '../common/components/top-app-bar/top-app-bar.component';
import { COMMON } from '../common';
import { MatCardModule } from '@angular/material/card';
import { AuthService, OrdersService } from '../core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormsModule } from '@angular/forms';
import { injectMutation, injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Chat, ChatType, User } from '@menno/types';
import { ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    TopAppBarComponent,
    COMMON,
    MatCardModule,
    MatToolbarModule,
    FormsModule,
    MatProgressSpinnerModule
],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {
  public auth = inject(AuthService);
  public http = inject(HttpClient);
  public ordersService = inject(OrdersService);
  public route = inject(ActivatedRoute);
  public queryClient = injectQueryClient();
  text = signal<string>('');
  ChatType = ChatType;
  User = User;

  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLElement>;

  get id() {
    return this.route.snapshot.params['id'];
  }

  query = injectQuery(() => ({
    queryKey: ['chat', 'order', this.id],
    queryFn: async () => {
      const orderId = this.id;
      if (!orderId) return [];
      const data = await lastValueFrom(this.http.get<Chat[]>(`chat/order/${orderId}`));
      // Backend returns DESC (newest first); store chronological (oldest first) so first paint is correct
      return [...data].reverse();
    },
    enabled: !!this.id,
    refetchInterval: 20000,
  }));

  orderQuery = injectQuery(() => ({
    queryKey: ['order', this.id],
    queryFn: () => lastValueFrom(this.ordersService.getById(this.id)),
    enabled: !!this.id,
  }));

  sendMutation = injectMutation(() => ({
    mutationFn: () => {
      const orderId = this.id;
      const order = this.orderQuery.data();
      if (!orderId) return Promise.reject(new Error('Order id is required'));
      const payload = {
        text: this.text(),
        shop: order?.shop?.id ? { id: order.shop.id } : undefined,
        order: { id: orderId },
      } as Chat;
      return lastValueFrom(this.http.post<Chat>(`chat`, payload));
    },
    onSuccess: (response) => {
      const orderId = this.id;
      this.text.set('');
      if (orderId) {
        const currentUser = this.auth.user();
        const messageWithUser = { ...response, user: currentUser ?? response.user };
        this.queryClient.setQueryData(['chat', 'order', orderId], (oldData: Chat[] | undefined) => {
          const list = oldData ?? [];
          return [...list, messageWithUser];
        });
      }
      // Do not invalidate here to avoid refetch overwriting with stale/empty; setQueryData above is enough
    },
  }));

  seenMutation = injectMutation(() => ({
    mutationFn: (ids: string[]) => lastValueFrom(this.http.post<void>(`chat/seen`, ids)),
    onSuccess: (_response, ids) => {
      const orderId = this.id;
      if (orderId) {
        this.queryClient.setQueryData(['chat', 'order', orderId], (oldData: Chat[] | undefined) => {
          const list = oldData ?? [];
          return list.map((item) => (ids.includes(item.id) ? { ...item, seen: true } : item));
        });
      }
    },
  }));

  constructor() {
    effect(() => {
      const chats = this.query.data();
      if (chats?.length) {
        this.scrollToEnd(100);

        const notSeen = chats.filter((item) => item.type === ChatType.Receive && !item.seen);
        if (notSeen.length) this.seenMutation.mutate(notSeen.map((item) => item.id));
      }
    });

    this.scrollToEnd(400);
  }

  scrollToEnd(timeout = 20) {
    setTimeout(() => {
      const el = this.scrollContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, timeout);
  }
}
