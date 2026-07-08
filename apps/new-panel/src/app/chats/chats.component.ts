import { Component, ElementRef, ViewChild, effect, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { SHARED } from '../shared';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { injectMutation, injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { Chat, ChatType, Member, Order, User } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { DialogService } from '../core/services/dialog.service';
import { SearchMemberAutocompleteComponent } from '../shared/components/search-member-autocomplete/search-member-autocomplete.component';
import {
  saxSearchNormal1Outline,
  saxSendOutline,
  saxArrowRightOutline,
  saxReceipt2Outline,
  saxMessageOutline,
} from '@ng-icons/iconsax/outline';

@Component({
  selector: 'app-chats',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatCardModule,
    MatProgressSpinnerModule,
    FormsModule,
    SearchMemberAutocompleteComponent,
  ],
  providers: [
    provideIcons({
      saxSearchNormal1Outline,
      saxSendOutline,
      saxArrowRightOutline,
      saxReceipt2Outline,
      saxMessageOutline,
    }),
  ],
  templateUrl: './chats.component.html',
  styleUrl: './chats.component.scss',
})
export class ChatsComponent {
  private readonly http = inject(HttpClient);
  private readonly queryClient = injectQueryClient();
  private readonly router = inject(Router);
  private readonly dialog = inject(DialogService);
  public readonly t = inject(TranslateService);

  text = signal<string>('');
  searchQuery = signal<string>('');
  selectedThread = signal<any | null>(null);
  showMobileChatArea = signal<boolean>(false);
  showPromoBanner = signal<boolean>(true);

  ChatType = ChatType;
  User = User;

  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLElement>;

  threadsQuery = injectQuery(() => ({
    queryKey: ['chats', 'threads'],
    queryFn: () => lastValueFrom(this.http.get<any[]>('/chat/threads')),
    refetchInterval: 15000,
  }));

  messagesQuery = injectQuery(() => ({
    queryKey: ['chat', 'user', this.selectedThread()?.user?.id],
    queryFn: () => lastValueFrom(this.http.get<Chat[]>(`/chat/user/${this.selectedThread()?.user?.id}`)),
    enabled: !!this.selectedThread()?.user?.id,
    refetchInterval: 10000,
  }));

  filteredThreads = computed(() => {
    const threads = this.threadsQuery.data() || [];
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return threads;
    return threads.filter((t) => {
      const name = `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.toLowerCase();
      const phone = t.user?.mobilePhone || '';
      return name.includes(query) || phone.includes(query);
    });
  });

  sendMutation = injectMutation(() => ({
    mutationFn: (dto: { text: string; userId: string; orderId: string }) =>
      lastValueFrom(
        this.http.post<Chat>('/chat', {
          text: dto.text,
          user: { id: dto.userId },
          order: { id: dto.orderId },
        } as Chat),
      ),
    onSuccess: (response) => {
      this.text.set('');
      this.queryClient.invalidateQueries({ queryKey: ['chats', 'threads'] });
      
      const userId = this.selectedThread()?.user?.id;
      if (userId) {
        this.queryClient.setQueryData(['chat', 'user', userId], (oldData: Chat[] | undefined) => {
          const list = oldData ?? [];
          return [...list, response];
        });
      }
      this.scrollToEnd(100);
    },
  }));

  seenMutation = injectMutation(() => ({
    mutationFn: (ids: string[]) => lastValueFrom(this.http.post<void>('/chat/seen', ids)),
    onSuccess: (_response, ids) => {
      this.queryClient.invalidateQueries({ queryKey: ['chats', 'threads'] });
      
      const userId = this.selectedThread()?.user?.id;
      if (userId) {
        this.queryClient.setQueryData(['chat', 'user', userId], (oldData: Chat[] | undefined) => {
          const list = oldData ?? [];
          return list.map((item) => (ids.includes(item.id) ? { ...item, seen: true } : item));
        });
      }
    },
  }));

  constructor() {
    effect(() => {
      const chats = this.messagesQuery.data();
      if (chats?.length) {
        this.scrollToEnd(100);

        const notSeen = chats.filter((item) => item.type === ChatType.Send && !item.seen);
        if (notSeen.length) {
          this.seenMutation.mutate(notSeen.map((item) => item.id));
        }
      }
    });
  }

  selectThread(thread: any) {
    this.selectedThread.set(thread);
    this.showMobileChatArea.set(true);
    this.showPromoBanner.set(true);
    this.scrollToEnd(200);

    // If there is any unread chats in thread preview, trigger seen immediately
    if (thread.unreadCount > 0 && this.messagesQuery.data()) {
      const notSeen = (this.messagesQuery.data() || []).filter(
        (item) => item.type === ChatType.Send && !item.seen,
      );
      if (notSeen.length) {
        this.seenMutation.mutate(notSeen.map((item) => item.id));
      }
    }
  }

  onMemberSelect(member: Member | null) {
    if (!member || !member.user) return;

    const threads = this.threadsQuery.data() || [];
    const existingThread = threads.find((t) => t.user?.id === member.user?.id);

    if (existingThread) {
      this.selectThread(existingThread);
    } else {
      this.http.get<Order>(`/chat/last-order/${member.user.id}`).subscribe({
        next: (lastOrder) => {
          if (lastOrder) {
            const tempThread = {
              user: member.user,
              lastChat: null,
              unreadCount: 0,
              lastOrder: lastOrder,
            };
            this.selectedThread.set(tempThread);
            this.showMobileChatArea.set(true);
            this.showPromoBanner.set(true);
            this.scrollToEnd(200);
          } else {
            this.dialog.alert(
              this.t.instant('chatsPage.noOrderTitle', { defaultValue: 'خطا' }),
              this.t.instant('chatsPage.noOrderMessage', { defaultValue: 'این مشتری هیچ سفارشی ثبت نکرده است و امکان گفتگو با وی وجود ندارد.' })
            );
          }
        },
      });
    }
  }

  backToList() {
    this.showMobileChatArea.set(false);
  }

  sendMessage() {
    const textVal = this.text().trim();
    const thread = this.selectedThread();
    if (!textVal || !thread) return;

    // Use order of the last message in this thread, or default to the customer's last order
    const chats = this.messagesQuery.data() || [];
    let orderId = '';
    
    // Find the latest message that has an associated order
    for (let i = chats.length - 1; i >= 0; i--) {
      const order = chats[i].order;
      if (order?.id) {
        orderId = order.id;
        break;
      }
    }

    if (!orderId && thread.lastOrder?.id) {
      orderId = thread.lastOrder.id;
    }

    if (!orderId) {
      // Fallback: This shouldn't normally happen since order is required,
      // but if we don't have it, we cannot save the chat according to backend rules.
      return;
    }

    this.sendMutation.mutate({
      text: textVal,
      userId: thread.user.id,
      orderId: orderId,
    });
  }

  viewLatestOrder(orderId?: string) {
    if (orderId) {
      this.router.navigate(['/admin/orders/details', orderId]);
    }
  }

  getAvatarPlaceholder(user?: User): string {
    if (!user) return '?';
    const first = user.firstName ? user.firstName.charAt(0) : '';
    const last = user.lastName ? user.lastName.charAt(0) : '';
    return (first + last).trim() || user.mobilePhone?.slice(-4) || 'U';
  }

  scrollToEnd(timeout = 50) {
    setTimeout(() => {
      const el = this.scrollContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, timeout);
  }
}
