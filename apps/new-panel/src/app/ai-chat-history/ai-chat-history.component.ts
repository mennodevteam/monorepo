import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

import { SHARED } from '../shared';
import { formatTokensKLabel } from '../home/ai-tokens';

type AiPanelMessage = {
  id: number;
  createdAt: string;
  userMessage: string;
  botMessage: string;
  totalTokens?: number | null;
  chatId: number;
};

@Component({
  selector: 'app-ai-chat-history',
  standalone: true,
  imports: [CommonModule, SHARED, MatToolbarModule, MatCardModule],
  templateUrl: './ai-chat-history.component.html',
  styleUrl: './ai-chat-history.component.scss',
})
export class AiChatHistoryComponent {
  private readonly http = inject(HttpClient);

  messagesQuery = injectQuery(() => ({
    queryKey: ['ai-chatbot-panel-messages-page'],
    queryFn: () => lastValueFrom(this.http.get<AiPanelMessage[]>('/ai-chatbot/panel/recent-messages')),
  }));

  formatTokensK(tokens: number | null | undefined): string {
    return formatTokensKLabel(tokens);
  }

  previewText(text: string, max = 120): string {
    const s = (text || '').replace(/\s+/g, ' ').trim();
    return s.length > max ? `${s.slice(0, max)}…` : s;
  }
}
