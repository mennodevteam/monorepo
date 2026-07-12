import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state.component';
import { DataLoadingComponent } from '../shared/components/data-loading/data-loading.component';
import { Router } from '@angular/router';
import { Campaign } from '@menno/types';
import { DialogService } from '../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { sortByCreatedAtDesc } from '@menno/utils';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-campaigns-list',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatTableModule,
    MatSlideToggleModule,
    EmptyStateComponent,
    DataLoadingComponent,
  ],
  templateUrl: './campaigns-list.component.html',
  styleUrl: './campaigns-list.component.scss',
})
export class CampaignsListComponent {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(DialogService);
  private readonly t = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly queryClient = injectQueryClient();

  readonly displayedColumns = ['index', 'title', 'startDate', 'endDate', 'status', 'orderCount', 'totalSales', 'netProfit', 'enabled', 'actions'];

  query = injectQuery(() => ({
    queryKey: ['campaigns'],
    queryFn: () => lastValueFrom(this.http.get<Campaign[]>('/campaigns')),
  }));

  deleteMutation = injectMutation(() => ({
    mutationFn: (id: string) => lastValueFrom(this.http.delete(`/campaigns/${id}`)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  }));

  data = computed(() => {
    const list = this.query.data();
    if (list) {
      return [...list].sort(sortByCreatedAtDesc);
    }
    return [];
  });

  isEmptyData = computed(() => this.data()?.length === 0);

  getCampaignStatus(campaign: Campaign): { label: string; color: string } {
    const now = new Date();
    const start = new Date(campaign.startDate);
    const end = new Date(campaign.endDate);

    if (start > now) {
      return { label: 'شروع نشده', color: 'blue' };
    }
    if (end < now) {
      return { label: 'تمام شده', color: 'red' };
    }
    return { label: 'جاری', color: 'green' };
  }

  addCampaign() {
    this.router.navigate(['/admin/campaigns/edit']);
  }

  editCampaign(campaign: Campaign) {
    this.router.navigate(['/admin/campaigns/edit'], { queryParams: { id: campaign.id } });
  }

  isDeletable(campaign: Campaign): boolean {
    return true;
  }

  async toggleEnable(campaign: Campaign, checked: boolean) {
    const prevEnabled = campaign.enabled;
    campaign.enabled = checked;
    try {
      await lastValueFrom(this.http.put(`/campaigns/${campaign.id}`, { enabled: checked }));
      this.queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    } catch (error) {
      campaign.enabled = prevEnabled;
      this.dialog.alert('خطا', 'تغییر وضعیت کمپین با خطا مواجه شد.');
    }
  }

  async deleteCampaign(campaign: Campaign) {
    const confirmed = await this.dialog.alert(
      'حذف کمپین',
      `توجه: حذف این کمپین باعث می‌شود تمامی آمارها و تحلیل‌های مربوط به آن از دست برود (سفارشات حذف نخواهند شد). آیا از حذف کمپین "${campaign.title}" اطمینان دارید؟`,
    );

    if (confirmed) {
      this.deleteMutation.mutate(campaign.id);
    }
  }

  openReport(campaign: Campaign) {
    this.router.navigate(['/admin/campaigns/report'], { queryParams: { id: campaign.id } });
  }
}
