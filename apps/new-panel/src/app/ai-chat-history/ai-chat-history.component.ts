import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { injectInfiniteQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

import { SHARED } from '../shared';
import { formatTokensKLabel } from '../home/ai-tokens';

const PAGE_SIZE = 15;

export type PanelChatMessage = {
  id: number;
  createdAt: string;
  userMessage: string;
  botMessage: string;
  totalTokens?: number | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
};

export type PanelChatCustomer = {
  userId: string;
  displayName: string;
  mobilePhone: string | null;
};

export type PanelChat = {
  id: number;
  createdAt: string;
  lastMessageAt: string;
  customer: PanelChatCustomer | null;
  messages: PanelChatMessage[];
};

export type PanelChatsPageResponse = {
  items: PanelChat[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

type DayGroup = {
  dateKey: string;
  sampleTs: number;
  chats: PanelChat[];
};

@Component({
  selector: 'app-ai-chat-history',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatDividerModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './ai-chat-history.component.html',
  styleUrl: './ai-chat-history.component.scss',
})
export class AiChatHistoryComponent {
  private readonly http = inject(HttpClient);

  readonly chatsQuery = injectInfiniteQuery(() => ({
    queryKey: ['ai-chatbot-panel-chats'],
    queryFn: ({ pageParam }) =>
      lastValueFrom(
        this.http.get<PanelChatsPageResponse>('/ai-chatbot/panel/chats', {
          params: { page: String(pageParam), limit: String(PAGE_SIZE) },
        }),
      ),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? Number(last.page) + 1 : undefined),
  }));

  readonly allChats = computed(() => {
    const d = this.chatsQuery.data();
    if (!d?.pages?.length) {
      return [] as PanelChat[];
    }
    const pages = d.pages as PanelChatsPageResponse[];
    return pages.reduce<PanelChat[]>((acc, p) => acc.concat(p.items ?? []), []);
  });

  readonly groupedByDay = computed((): DayGroup[] => {
    const list = this.allChats();
    const dayMap = new Map<string, { dateKey: string; chats: PanelChat[]; sampleTs: number }>();
    for (const chat of list) {
      const t = new Date(chat.lastMessageAt).getTime();
      const d = new Date(chat.lastMessageAt);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const g = dayMap.get(dateKey);
      if (!g) {
        dayMap.set(dateKey, { dateKey, chats: [chat], sampleTs: t });
      } else {
        g.chats.push(chat);
        g.sampleTs = Math.max(g.sampleTs, t);
      }
    }
    return [...dayMap.values()]
      .sort((a, b) => b.sampleTs - a.sampleTs)
      .map(({ dateKey, chats, sampleTs }) => ({ dateKey, chats, sampleTs }));
  });

  formatTokensK(tokens: number | null | undefined): string {
    return formatTokensKLabel(tokens);
  }

  previewText(text: string, max = 120): string {
    const s = (text || '').replace(/\s+/g, ' ').trim();
    return s.length > max ? `${s.slice(0, max)}…` : s;
  }

  showPhoneLine(c: PanelChatCustomer | null): boolean {
    if (!c?.mobilePhone) {
      return false;
    }
    return c.displayName.trim() !== c.mobilePhone.trim();
  }

  loadMore(): void {
    void this.chatsQuery.fetchNextPage();
  }
}
