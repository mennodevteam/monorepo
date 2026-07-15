import { Component, ElementRef, ViewChild, effect, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { SHARED } from '../shared';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { injectMutation, injectQuery, injectQueryClient, injectInfiniteQuery } from '@tanstack/angular-query-experimental';
import { Chat, ChatType, Member, Order, User } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
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
export class ChatsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly queryClient = injectQueryClient();
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
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

  threadsInfiniteQuery = injectInfiniteQuery(() => ({
    queryKey: ['chats', 'threads-paginated', this.searchQuery()],
    queryFn: ({ pageParam }) =>
      lastValueFrom(
        this.http.get<any[]>('/chat/threads-paginated', {
          params: {
            take: '20',
            skip: String(pageParam),
            search: this.searchQuery(),
          },
        }),
      ),
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const take = 20;
      return last?.length === take ? pages.length * take : null;
    },
  }));

  threads = computed(() => {
    const pages = this.threadsInfiniteQuery.data()?.pages;
    if (!pages) return [];
    return pages.reduce((acc, val) => acc.concat(val), []);
  });

  messagesQuery = injectQuery(() => ({
    queryKey: ['chat', 'user', this.selectedThread()?.user?.id],
    queryFn: () => lastValueFrom(this.http.get<Chat[]>(`/chat/user/${this.selectedThread()?.user?.id}`)),
    enabled: !!this.selectedThread()?.user?.id,
    refetchInterval: 10000,
  }));

  activeUser = computed(() => {
    const thread = this.selectedThread();
    if (!thread) return null;
    if (thread.user?.firstName || thread.user?.lastName || thread.user?.mobilePhone) {
      return thread.user;
    }
    // Fallback: extract user from messages list if thread was rehydrated from URL query params
    const messages = this.messagesQuery.data() || [];
    const firstMsg = messages.find((m) => m.user?.id === thread.user?.id);
    return firstMsg?.user || thread.user;
  });

  messagesByDay = computed(() => {
    const chats = this.messagesQuery.data() || [];
    const sortedChats = chats.slice();
    const dayMap = new Map<string, { dateKey: string; date: Date; messages: Chat[] }>();

    for (const chat of sortedChats) {
      const d = new Date(chat.createdAt);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const g = dayMap.get(dateKey);
      if (!g) {
        dayMap.set(dateKey, { dateKey, date: d, messages: [chat] });
      } else {
        g.messages.push(chat);
      }
    }
    return [...dayMap.values()];
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
      this.queryClient.invalidateQueries({ queryKey: ['chats', 'threads-paginated'] });
      
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
      this.queryClient.invalidateQueries({ queryKey: ['chats', 'threads-paginated'] });
      
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

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const userId = params['userId'];
      if (userId && this.selectedThread()?.user?.id !== userId) {
        const thread = this.threads().find((t: any) => t.user?.id === userId);
        if (thread) {
          this.selectThread(thread);
        } else {
          // Rehydrate a placeholder thread; user details will be resolved via activeUser computed
          const placeholderThread = {
            user: { id: userId },
            lastChat: null,
            unreadCount: 0,
          };
          this.selectThread(placeholderThread);
        }
      }
    });
  }

  selectThread(thread: any) {
    this.selectedThread.set(thread);
    this.showMobileChatArea.set(true);
    this.showPromoBanner.set(true);
    this.scrollToEnd(200);

    // Persist active conversation in query parameter
    this.router.navigate([], {
      queryParams: { userId: thread.user?.id },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });

    if (thread.unreadCount > 0 && this.messagesQuery.data()) {
      const notSeen = (this.messagesQuery.data() || []).filter(
        (item) => item.type === ChatType.Send && !item.seen,
      );
      if (notSeen.length) {
        this.seenMutation.mutate(notSeen.map((item) => item.id));
      }
    }
  }

  onScroll(event: Event) {
    const el = event.target as HTMLElement;
    if (el) {
      const threshold = 50;
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
      if (isAtBottom && this.threadsInfiniteQuery.hasNextPage() && !this.threadsInfiniteQuery.isFetchingNextPage()) {
        this.threadsInfiniteQuery.fetchNextPage();
      }
    }
  }

  onMemberSelect(member: Member | null) {
    if (!member || !member.user) return;

    this.http.get<Order>(`/chat/last-order/${member.user.id}`).subscribe({
      next: (lastOrder) => {
        if (lastOrder) {
          const threads = this.threads();
          const existingThread = threads.find((t: any) => t.user?.id === member.user!.id);

          if (existingThread) {
            this.selectThread(existingThread);
          } else {
            const tempThread = {
              user: member.user,
              lastChat: null,
              unreadCount: 0,
              order: lastOrder,
            };
            this.selectThread(tempThread);
          }
        } else {
          this.dialog.alert(
            this.t.instant('chatsPage.noOrderTitle', { defaultValue: 'خطا' }),
            this.t.instant('chatsPage.noOrderMessage', { defaultValue: 'این مشتری هیچ سفارشی ثبت نکرده است و امکان گفتگو با وی وجود ندارد.' })
          );
        }
      },
    });
  }

  backToList() {
    this.showMobileChatArea.set(false);
  }

  sendMessage() {
    const textVal = this.text().trim();
    const thread = this.selectedThread();
    if (!textVal || !thread) return;

    // Use thread's order or fetch from last chat's order
    const orderId = thread.order?.id || thread.lastChat?.order?.id;
    if (!orderId) {
      // If order details aren't ready yet, fetch last order to satisfy DB requirements
      this.http.get<Order>(`/chat/last-order/${thread.user.id}`).subscribe({
        next: (lastOrder) => {
          if (lastOrder?.id) {
            this.sendMutation.mutate({
              text: textVal,
              userId: thread.user.id,
              orderId: lastOrder.id,
            });
          }
        },
      });
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

  getAvatarPlaceholder(user?: User | null): string {
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
