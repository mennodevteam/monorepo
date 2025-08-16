import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { SmsGroup, SmsStatus } from '@menno/types';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SHARED } from '../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-sms-list',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    SHARED,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './sms-list.component.html',
  styleUrl: './sms-list.component.scss',
})
export class SmsListComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  displayedColumns = ['message', 'receptor', 'cost', 'status'];
  SmsStatus = SmsStatus;

  public query = injectQuery(() => ({
    queryKey: ['smsGroup', this.route.snapshot.params['id']],
    queryFn: () =>
      lastValueFrom(
        this.http.get<SmsGroup>(`/sms/group/${this.route.snapshot.params['id']}`),
      ),
  }));

  get smsGroup() {
    return this.query.data();
  }

  get loading() {
    return this.query.isPending();
  }

  get sortedSmsList() {
    if (!this.smsGroup?.list) return [];
    return [...this.smsGroup.list].sort((a, b) => a.status - b.status);
  }
}
