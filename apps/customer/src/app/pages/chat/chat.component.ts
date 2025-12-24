import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TopAppBarComponent } from '../../shared/components/top-app-bar/top-app-bar.component';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
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

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    TopAppBarComponent,
    CommonModule,
    MatCardModule,
    MatToolbarModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    DatePipe,
    ImageLoaderDirective,
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

  get id() {
    return this.route.snapshot.params['id'];
  }

  query = injectQuery(() => ({
    queryKey: ['chat', 'order', this.id],
    queryFn: () => lastValueFrom(this.http.get<Chat[]>(`chat/order/${this.id}`)),
    refetchInterval: 20000,
    select: (data: Chat[]) => data.reverse(),
  }));

  orderQuery = injectQuery(() => ({
    queryKey: ['order', this.id],
    queryFn: () => lastValueFrom(this.ordersService.getById(this.id)),
  }));

  sendMutation = injectMutation(() => ({
    mutationFn: () =>
      lastValueFrom(
        this.http.post<Chat>(`chat`, {
          text: this.text(),
          shop: this.orderQuery.data()?.shop,
          order: { id: this.id },
        } as Chat),
      ),
    onSuccess: (response) => {
      this.text.set('');
      this.queryClient.invalidateQueries({ queryKey: ['chat'] });
      this.queryClient.setQueryData(['chat', 'order', this.id], (oldData: Chat[]) => {
        return [...oldData.reverse(), response];
      });
    },
  }));

  seenMutation = injectMutation(() => ({
    mutationFn: (ids: string[]) => lastValueFrom(this.http.post<void>(`chat/seen`, ids)),
    onSuccess: (response, ids) => {
      this.queryClient.invalidateQueries({ queryKey: ['chat'] });
      this.queryClient.setQueryData(['chat', 'order', this.id], (oldData: Chat[]) => {
        return oldData.reverse().map((item) => (ids.includes(item.id) ? { ...item, seen: true } : item));
      });
    },
  }));

  constructor() {
    effect(() => {
      const chats = this.query.data();
      if (chats?.length) {
        this.scrollEnd();

        const notSeen = chats.filter((item) => item.type === ChatType.Receive && !item.seen);
        if (notSeen.length) this.seenMutation.mutate(notSeen.map((item) => item.id));
      }
    });

    this.scrollEnd(400);
  }

  scrollEnd(timeout = 20) {
    setTimeout(() => {
      window.scrollTo({ top: 999999999 });
    }, timeout);
  }
}

