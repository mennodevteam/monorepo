import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { HomeSection } from '@menno/types';
import { firstValueFrom } from 'rxjs';

const HOME_SECTIONS_QUERY_KEY = ['homeSections'] as const;

@Injectable({
  providedIn: 'root',
})
export class HomeSectionsService {
  private readonly http = inject(HttpClient);
  private readonly queryClient = inject(QueryClient);
  private readonly snack = inject(MatSnackBar);
  private readonly t = inject(TranslateService);

  readonly homeSectionsQuery = injectQuery(() => ({
    queryKey: HOME_SECTIONS_QUERY_KEY,
    queryFn: () => this.fetchHomeSections(),
  }));

  readonly homeSections = () => this.homeSectionsQuery.data() || [];

  private fetchHomeSections() {
    return firstValueFrom(this.http.get<HomeSection[]>(`/home-sections`));
  }

  readonly saveMutation = injectMutation(() => ({
    mutationFn: (section: HomeSection) => {
      if (section.id) {
        return firstValueFrom(this.http.put<HomeSection>(`/home-sections/${section.id}`, section));
      }
      return firstValueFrom(this.http.post<HomeSection>(`/home-sections`, section));
    },
    onMutate: () => {
      this.snack.open(this.t.instant('app.saving'), '', { duration: 3000 });
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: HOME_SECTIONS_QUERY_KEY });
      this.snack.open(this.t.instant('app.savedSuccessfully'), '', { duration: 2000 });
    },
    onError: () => {
      this.snack.open(this.t.instant('errors.changeError'), '', { duration: 2000 });
    },
  }));

  readonly deleteMutation = injectMutation(() => ({
    mutationFn: (id: string) => firstValueFrom(this.http.delete(`/home-sections/${id}`)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: HOME_SECTIONS_QUERY_KEY });
    },
  }));

  readonly reorderMutation = injectMutation(() => ({
    mutationFn: (ids: string[]) =>
      firstValueFrom(this.http.post<HomeSection[]>(`/home-sections/reorder`, { ids })),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: HOME_SECTIONS_QUERY_KEY });
    },
  }));

  readonly toggleVisibilityMutation = injectMutation(() => ({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      firstValueFrom(this.http.put<HomeSection>(`/home-sections/${id}/visibility`, { isVisible })),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: HOME_SECTIONS_QUERY_KEY });
    },
  }));
}

