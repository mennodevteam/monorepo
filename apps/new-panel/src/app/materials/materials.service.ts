import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { InventoryTransaction, Material } from '@menno/types';
import { injectMutation, injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MaterialsService {
  private http = inject(HttpClient);
  private baseUrl = '/materials';
  private queryClient = injectQueryClient();
  public materialsQuery = injectQuery(() => ({
    queryKey: ['materials'],
    queryFn: () => lastValueFrom(this.http.get<Material[]>(this.baseUrl)),
  }));

  public saveMaterialMutation = injectMutation(() => ({
    mutationFn: (data: Partial<Material> & { id?: string }) => {
      return lastValueFrom(this.http.post<Material>(this.baseUrl, data));
    },
    onSuccess: () => this.queryClient.invalidateQueries({ queryKey: ['materials'] }),
  }));

  public deleteMaterialMutation = injectMutation(() => ({
    mutationFn: (id: string) => lastValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`)),
    onSuccess: () => this.queryClient.invalidateQueries({ queryKey: ['materials'] }),
  }));

  public transactionMutation = injectMutation(() => ({
    mutationFn: (data: Partial<InventoryTransaction>) =>
      lastValueFrom(this.http.post<void>(`${this.baseUrl}/transactions`, data)),
    onSuccess: () => this.queryClient.invalidateQueries({ queryKey: ['materials'] }),
  }));
}
