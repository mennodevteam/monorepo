import { Component, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../../shared';
import { MatCardModule } from '@angular/material/card';
import { FormControl, FormsModule, Validators } from '@angular/forms';
import { ShopService } from '../../../shop/shop.service';
import { HttpClient } from '@angular/common/http';
import { injectMutation, injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { Chat, ChatType, Order, User } from '@menno/types';
import { lastValueFrom } from 'rxjs';
import { DialogService } from '../../../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-order-chat',
  standalone: true,
  imports: [CommonModule, SHARED, MatCardModule, FormsModule],
  templateUrl: './order-chat.component.html',
  styleUrl: './order-chat.component.scss',
})
export class OrderChatComponent {
  public shopService = inject(ShopService);
  public http = inject(HttpClient);
  public dialog = inject(DialogService);
  public t = inject(TranslateService);
  public queryClient = injectQueryClient();
  order = input.required<Order>();
  text = signal<string>('');
  ChatType = ChatType;
  User = User;

  query = injectQuery(() => ({
    queryKey: ['chat', 'order', this.order().id],
    queryFn: () => lastValueFrom(this.http.get<Chat[]>(`/chat/order/${this.order().id}`)),
    refetchInterval: 20000,
  }));

  sendMutation = injectMutation(() => ({
    mutationFn: (text: string) =>
      lastValueFrom(
        this.http.post<Chat>(`/chat`, {
          text,
          order: { id: this.order().id },
          user: this.order().customer,
        } as Chat),
      ),
    onSuccess: (response) => {
      this.text.set('');
      this.queryClient.invalidateQueries({ queryKey: ['chat'] });
      this.queryClient.setQueryData(['chat', 'order', this.order().id], (oldData: Chat[]) => {
        return [response, ...oldData];
      });
    },
  }));

  seenMutation = injectMutation(() => ({
    mutationFn: (ids: string[]) => lastValueFrom(this.http.post<void>(`/chat/seen`, ids)),
    onSuccess: (response, ids) => {
      this.queryClient.invalidateQueries({ queryKey: ['chat'] });
      this.queryClient.setQueryData(['chat', 'order', this.order().id], (oldData: Chat[]) => {
        return [...oldData.map((item) => (ids.includes(item.id) ? { ...item, seen: true } : item))];
      });
    },
  }));

  constructor() {
    effect(() => {
      const chats = this.query.data();
      if (chats?.length) {
        this.scrollEnd();

        const notSeen = chats.filter((item) => item.type === ChatType.Send && !item.seen);
        if (notSeen.length) this.seenMutation.mutate(notSeen.map((item) => item.id));
      }
    });

    this.scrollEnd(400);
  }

  scrollEnd(timeout = 20) {
    setTimeout(() => {
      // window.scrollTo({ top: 999999999 });
    }, timeout);
  }

  sendMessage() {
    this.dialog
      .prompt(this.t.instant('chat.title'), {
        text: {
          label: this.t.instant('chat.text'),
          control: new FormControl('', Validators.required),
          type: 'textarea',
          rows: 4,
        },
      })
      .then((dto) => {
        if (dto) {
          const customer = this.order().customer;
          const text = dto.text.replace(/@@@/g, customer ? User.fullName(customer) : 'مشتری');
          this.sendMutation.mutate(text);
        }
      });
  }
}
