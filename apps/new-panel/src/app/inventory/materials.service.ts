import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BillOfMaterial, InventoryTransaction, Material } from '@menno/types';
import { injectMutation, injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class MaterialsService {
  private http = inject(HttpClient);
  private baseUrl = '/materials';
  private queryClient = injectQueryClient();
  private snack = inject(MatSnackBar);
  private translate = inject(TranslateService);
  public materialsQuery = injectQuery(() => ({
    queryKey: ['materials'],
    queryFn: () => lastValueFrom(this.http.get<Material[]>(this.baseUrl)),
    select: (data: Material[]) => data?.sort((a: Material, b: Material) => a.name.localeCompare(b.name)),
  }));

  public saveMaterialMutation = injectMutation(() => ({
    mutationFn: (data: Partial<Material> & { id?: string }) => {
      return lastValueFrom(this.http.post<Material>(this.baseUrl, data));
    },
    onMutate: () => {
      this.snack.open(this.translate.instant('app.saving'));
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['materials'] })
      this.snack.open(this.translate.instant('app.savedSuccessfully'));
    },
  }));

  public deleteMaterialMutation = injectMutation(() => ({
    mutationFn: (id: string) => lastValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`)),
    onMutate: () => {
      this.snack.open(this.translate.instant('app.deleting'));
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['materials'] })
      this.snack.open(this.translate.instant('app.deleted'));
    },
  }));

  public transactionMutation = injectMutation(() => ({
    mutationFn: (data: Partial<InventoryTransaction>) =>
      lastValueFrom(this.http.post<void>(`${this.baseUrl}/transactions`, data)),
    onMutate: () => {
      this.snack.open(this.translate.instant('app.saving'));
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['materials'] })
      this.snack.open(this.translate.instant('app.savedSuccessfully'));
    },
  }));

  saveBomMutation = injectMutation(() => ({
    mutationFn: (data: Partial<BillOfMaterial>) =>
      lastValueFrom(this.http.post<void>(`${this.baseUrl}/boms`, data)),
    onMutate: () => {
      this.snack.open(this.translate.instant('app.saving'));
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['materials'] })
      this.snack.open(this.translate.instant('app.savedSuccessfully'));
    },
  }));

  deleteBomMutation = injectMutation(() => ({
    mutationFn: (id: string) => lastValueFrom(this.http.delete<void>(`${this.baseUrl}/boms/${id}`)),
    onMutate: () => {
      this.snack.open(this.translate.instant('app.deleting'));
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['materials'] })
      this.snack.open(this.translate.instant('app.deleted'));
    },
  }));

  public uploadMaterialsMutation = injectMutation(() => ({
    mutationFn: (materials: Partial<Material>[]) => {
      return lastValueFrom(this.http.post<{ success: number; errors: string[] }>(`${this.baseUrl}/upload`, materials));
    },
    onSuccess: () => this.queryClient.invalidateQueries({ queryKey: ['materials'] }),
  }));
}
