import { Component, computed, effect, inject, signal } from '@angular/core';

import { TopAppBarComponent } from '../common/components/top-app-bar/top-app-bar.component';
import { COMMON } from '../common';
import { MatCardModule } from '@angular/material/card';
import { AuthService, OrdersService, ShopService } from '../core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormsModule } from '@angular/forms';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AiChat, AiChatMessage, User } from '@menno/types';
import { ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const AI_CHAT_KEY = 'ai-chat';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [
    TopAppBarComponent,
    COMMON,
    MatCardModule,
    MatToolbarModule,
    FormsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './ai-chat.component.html',
  styleUrl: './ai-chat.component.scss',
})
export class AiChatComponent {
  public auth = inject(AuthService);
  public http = inject(HttpClient);
  public route = inject(ActivatedRoute);
  public queryClient = inject(QueryClient);
  public shopService = inject(ShopService);
  text = signal<string>('');
  User = User;

  get id() {
    return sessionStorage.getItem(AI_CHAT_KEY);
  }

  query = injectQuery(() => ({
    queryKey: ['ai-chat'],
    queryFn: () => lastValueFrom(this.http.get<AiChat>(`ai-chatbot/chat/${this.id}`)),
    enabled: !!this.id,
  }));

  messages = computed(() => this.query.data()?.messages || []);

  sendMutation = injectMutation(() => ({
    mutationFn: () =>
      lastValueFrom(
        this.http.post<AiChatMessage>(`ai-chatbot/chat`, {
          message: this.text(),
          shopId: this.shopService.shop?.id,
          chatId: this.id,
        }),
      ),
    onSuccess: (response) => {
      this.text.set('');
      this.queryClient.invalidateQueries({ queryKey: ['ai-chat'] });
      // this.queryClient.setQueryData(['ai-chat'], (oldData: AiChat[]) => {
      //   return [...oldData.reverse(), response];
      // });
    },
  }));

  constructor() {
    effect(() => {
      const messages = this.messages();
      if (messages.length) {
        this.scrollEnd();
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
