import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Menu, Product, Status } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { injectMutation, injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

const QUERY_KEY = ['menus'];

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  readonly http = inject(HttpClient);
  readonly snack = inject(MatSnackBar);
  readonly t = inject(TranslateService);
  readonly queryClient = injectQueryClient();

  private query = injectQuery(() => ({
    queryKey: QUERY_KEY,
    queryFn: () => lastValueFrom(this.http.get<Menu>('/menus')),
  }));

  data = computed(() => {
    return this.query.data();
  });

  categories = computed(() => {
    const data = this.query.data();
    const categories = data?.categories
      ?.filter((item) => !item.deletedAt)
      .sort((a, b) => {
        if (a.position === b.position) {
          return new Date(a.createdAt || 0).valueOf() - new Date(b.createdAt || 0).valueOf();
        }
        return (b.position || 1000) - (a.position || 1000);
      });

    return categories;
  });

  saveProductMutation = injectMutation(() => ({
    mutationFn: (dto: Partial<Product>) => lastValueFrom(this.http.post<Product>(`/products`, dto)),
    onMutate: (dto) => {
      this.queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previousData = this.queryClient.getQueryData<Menu>(QUERY_KEY);
      this.queryClient.setQueryData(QUERY_KEY, (old: Menu) => {
        if (dto.id) {
          const product = Menu.getProductById(old, dto.id);
          if (product) {
            Object.assign(product, dto);
            return { ...old };
          }
        } else if (dto.category) {
          const category = old.categories?.find((x) => x.id === dto.category!.id);
          category?.products?.push(dto as Product);
          return { ...old };
        }
        return old;
      });

      return { previousData };
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (err, newData, context) => {
      this.snack.open(this.t.instant('errors.changeError'), '', { duration: 2000 });
      this.queryClient.setQueryData(QUERY_KEY, context?.previousData);
    },
  }));
}
