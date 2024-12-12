import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { OrderMessage } from '@menno/types';
import { OrderMessagesTableComponent } from "./table/table.component";

@Component({
  selector: 'app-sms',
  standalone: true,
  imports: [CommonModule, SHARED, MatToolbarModule, MatCardModule, OrderMessagesTableComponent],
  templateUrl: './sms.component.html',
  styleUrl: './sms.component.scss',
})
export class AutoSmsSettingComponent {
  private readonly http = inject(HttpClient);
  query = injectQuery(() => ({
    queryKey: ['orderMessages'],
    queryFn: () => lastValueFrom(this.http.get<OrderMessage[]>('/orderMessages')),
  }));
}
