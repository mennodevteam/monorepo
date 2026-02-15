import { Component, effect, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopAppBarComponent } from '../../shared/components/top-app-bar/top-app-bar.component';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { OrdersService } from '../../core/services/orders.service';
import { injectMutation, injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Chat, ChatType, User } from '@menno/types';
import { ActivatedRoute } from '@angular/router';
import { ImageLoaderDirective } from '../../shared/directives/image-loader.directive';
import { LinkifyDirective } from '../../shared/directives/linkify.directive';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PdatePipe } from '../../shared/pipes/pdate.pipe';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { saxEyeBold } from '@ng-icons/iconsax/bold';
import { saxMessage2Outline, saxSend1Outline } from '@ng-icons/iconsax/outline';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    TopAppBarComponent,
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    PdatePipe,
    ImageLoaderDirective,
    LinkifyDirective,
    EmptyStateComponent,
    NgIcon,
  ],
  providers: [provideIcons({ saxEyeBold, saxMessage2Outline, saxSend1Outline })],
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
  readonly messageIcon = saxMessage2Outline;
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

