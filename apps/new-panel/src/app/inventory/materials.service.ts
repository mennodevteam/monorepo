import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BillOfMaterial,
  CostUpdateStrategy,
  InventoryTransaction,
  InventoryTransactionType,
  Material,
} from '@menno/types';
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
  }));

  public saveMaterialMutation = injectMutation(() => ({
    mutationFn: (data: Partial<Material> & { id?: string }) => {
      return lastValueFrom(this.http.post<Material>(this.baseUrl, data));
    },
    onMutate: (data) => {
      this.queryClient.cancelQueries({ queryKey: ['materials'] });
      const oldData = this.queryClient.getQueryData<Material[]>(['materials']);
      this.queryClient.setQueryData(['materials'], (old: Material[]) => {
        if (data.id) {
          return old.map((material) => (material.id === data.id ? { ...material, ...data } : material));
        }
        return [...old, data as unknown as Material];
      });
      return oldData;
    },
    onError: (error, data, context) => {
      this.queryClient.setQueryData(['materials'], context);
      this.snack.open(this.translate.instant('errors.changeError'), '', { duration: 2000 });
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  }));

  public deleteMaterialMutation = injectMutation(() => ({
    mutationFn: (id: string) => lastValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`)),
    onMutate: (id) => {
      this.queryClient.cancelQueries({ queryKey: ['materials'] });
      const oldData = this.queryClient.getQueryData<Material[]>(['materials']);
      this.queryClient.setQueryData(['materials'], (old: Material[]) => {
        return old.filter((material) => material.id !== id);
      });
      return oldData;
    },
    onError: (error, data, context) => {
      this.queryClient.setQueryData(['materials'], context);
      this.snack.open(this.translate.instant('errors.changeError'), '', { duration: 2000 });
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  }));

  public transactionMutation = injectMutation(() => ({
    mutationFn: (data: Partial<InventoryTransaction>) =>
      lastValueFrom(this.http.post<void>(`${this.baseUrl}/transactions`, data)),
    onMutate: (data) => {
      this.queryClient.cancelQueries({ queryKey: ['materials'] });
      const oldData = this.queryClient.getQueryData<Material[]>(['materials']);
      this.queryClient.setQueryData(['materials'], (old: Material[]) => {
        return old.map((material) => {
          if (material.id === data.material?.id) {
            const newMaterial = { ...material };

            if (data.type === InventoryTransactionType.Purchase) {
              newMaterial.stock = material.stock + (data.quantity ?? 0);
              if (data.costUpdateStrategy === CostUpdateStrategy.Last) newMaterial.cost = data.unitPrice;
              if (data.costUpdateStrategy === CostUpdateStrategy.Average) newMaterial.cost = undefined;
            } else if (data.type === InventoryTransactionType.Adjustment) {
              newMaterial.stock = data.quantity ?? material.stock;
            }

            return newMaterial;
          }
          return material;
        });
      });
      return oldData;
    },
    onError: (error, data, context) => {
      this.queryClient.setQueryData(['materials'], context);
      this.snack.open(this.translate.instant('errors.changeError'), '', { duration: 2000 });
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  }));

  saveBomMutation = injectMutation(() => ({
    mutationFn: (data: Partial<BillOfMaterial>) =>
      lastValueFrom(this.http.post<void>(`${this.baseUrl}/boms`, data)),
    onMutate: (data) => {
      this.queryClient.cancelQueries({ queryKey: ['materials'] });
      const oldData = this.queryClient.getQueryData<Material[]>(['materials']);
      this.queryClient.setQueryData(['materials'], (old: Material[]) => {
        return old.map((material) => {
          if (material.id === data.material?.id) {
            const newMaterial = { ...material };
            if (data.id) {
              newMaterial.boms = material.boms.map((bom) =>
                bom.id === data.id ? { ...bom, ...(data as BillOfMaterial) } : bom,
              );
            } else {
              newMaterial.boms = [...material.boms, data as BillOfMaterial];
            }
            return newMaterial;
          }
          return material;
        });
      });
      return oldData;
    },
    onError: (error, data, context) => {
      this.queryClient.setQueryData(['materials'], context);
      this.snack.open(this.translate.instant('errors.changeError'), '', { duration: 2000 });
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  }));

  deleteBomMutation = injectMutation(() => ({
    mutationFn: (id: string) => lastValueFrom(this.http.delete<void>(`${this.baseUrl}/boms/${id}`)),
    onMutate: (id) => {
      this.queryClient.cancelQueries({ queryKey: ['materials'] });
      const oldData = this.queryClient.getQueryData<Material[]>(['materials']);
      this.queryClient.setQueryData(['materials'], (old: Material[]) => {
        return old.map((material) => {
          if (material.boms.some((bom) => bom.id === id)) {
            const newMaterial = { ...material };
            newMaterial.boms = material.boms.filter((bom) => bom.id !== id);
            return newMaterial;
          }
          return material;
        });
      });
      return oldData;
    },
    onError: (error, data, context) => {
      this.queryClient.setQueryData(['materials'], context);
      this.snack.open(this.translate.instant('errors.changeError'), '', { duration: 2000 });
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  }));

  public uploadMaterialsMutation = injectMutation(() => ({
    mutationFn: (materials: Partial<Material>[]) => {
      return lastValueFrom(
        this.http.post<{ success: number; errors: string[] }>(`${this.baseUrl}/upload`, materials),
      );
    },
    onSuccess: () => this.queryClient.invalidateQueries({ queryKey: ['materials'] }),
  }));
}
