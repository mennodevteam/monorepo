import { Component, inject, signal } from '@angular/core';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Mission, Status } from '@menno/types';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';
import { ShopService } from '../../shop/shop.service';
import { DialogService } from '../../core/services/dialog.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-mission-list',
  standalone: true,
  imports: [
    SHARED,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    MatSlideToggleModule,
    MatIconModule,
    TranslateModule,
    EmptyStateComponent
  ],
  templateUrl: './mission-list.component.html',
  styleUrl: './mission-list.component.scss',
})
export class MissionListComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snack = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly shop = inject(ShopService);
  private readonly dialog = inject(DialogService);
  private readonly queryClient = inject(QueryClient);

  readonly Status = Status;
  readonly displayedColumns = ['title', 'status', 'date', 'actions'];

  query = injectQuery(() => ({
    queryKey: ['missionList'],
    queryFn: () => lastValueFrom(this.http.get<Mission[]>(`/missions`)),
  }));

  changeStatusMutation = injectMutation(() => ({
    mutationFn: (data: { id: number; status: Status }) =>
      lastValueFrom(this.http.post<Mission>(`/missions`, data)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['missionList'] });
    },
    onError: () => {
      this.snack.open(this.translate.instant('errors.changeError'), '', { duration: 2000 });
    },
  }));

  deleteMutation = injectMutation(() => ({
    mutationFn: (id: number) => lastValueFrom(this.http.delete(`/missions/${id}`)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['missionList'] });
      this.snack.open(this.translate.instant('app.deletedSuccessfully'), '', { duration: 2000 });
    },
    onError: () => {
      this.snack.open(this.translate.instant('errors.deleteError'), '', { duration: 2000 });
    },
  }));

  async changeStatus(mission: Mission, checked: boolean) {
    const newStatus = checked ? Status.Active : Status.Inactive;
    await this.changeStatusMutation.mutateAsync({ id: mission.id, status: newStatus });
  }

  async deleteMission(mission: Mission) {
    const confirmed = await this.dialog.alert(
      this.translate.instant('app.confirmDelete'),
      this.translate.instant('app.confirmDeleteMessage', { value: mission.title })
    );
    
    if (confirmed) {
      await this.deleteMutation.mutateAsync(mission.id);
    }
  }

  addMission() {
    this.router.navigate(['edit'], { relativeTo: this.route });
  }
} 