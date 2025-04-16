import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Menu, MenuCost, Product, ProductCategory } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { injectMutation, injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

const QUERY_KEY = ['menus'];

const DEFAULT_SORT_FUNC = (
  a: { createdAt?: Date; position?: number },
  b: { createdAt?: Date; position?: number },
) => {
  if (a.position === b.position) {
    return new Date(a.createdAt || 0).valueOf() - new Date(b.createdAt || 0).valueOf();
  }
  return (a.position ?? 1000) - (b.position ?? 1000);
};

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
    const data = this.query.data();
    if (data) {
      const cloned = structuredClone(data);
      Menu.setRefsAndSort(cloned, undefined, true, true);
      return { ...cloned };
    }
    return;
  });

  categories = computed(() => this.data()?.categories);

  private createBaseMutation<T, D>(config: {
    mutationFn: (dto: D) => Promise<T>;
    updateCache: (oldData: Menu, dto: D) => Menu;
    onSuccess?: () => void;
  }) {
    return injectMutation(() => ({
      mutationFn: config.mutationFn,
      onMutate: (dto) => {
        this.queryClient.cancelQueries({ queryKey: QUERY_KEY });
        const previousData = this.queryClient.getQueryData<Menu>(QUERY_KEY);
        this.queryClient.setQueryData(QUERY_KEY, (oldData: Menu) => {
          return config.updateCache(structuredClone(oldData), dto);
        });
        return { previousData };
      },
      onSuccess: () => {
        this.queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        config.onSuccess?.();
      },
      onError: (err, newData, context) => {
        this.snack.open(this.t.instant('errors.changeError'), '', { duration: 2000 });
        this.queryClient.setQueryData(QUERY_KEY, context?.previousData);
      },
    }));
  }

  saveProductMutation = this.createBaseMutation<Product, Partial<Product>>({
    mutationFn: (dto) => lastValueFrom(this.http.post<Product>(`/products`, dto)),
    updateCache: (old, dto) => {
      if (dto.id) {
        const product = Menu.getProductById(old, dto.id);
        if (product) {
          dto.variants = dto.variants?.map((variant) => {
            if (variant.id) {
              const exist = product.variants?.find((x) => x.id === variant.id);
              if (exist) {
                Object.assign(exist, variant);
                return exist;
              }
            }
            return variant;
          });
          Object.assign(product, dto);
          return { ...old };
        }
      } else if (dto.category) {
        const category = old.categories?.find((x) => x.id === dto.category!.id);
        category?.products?.push(dto as Product);
        return { ...old };
      }
      return old;
    },
  });

  sortProductsMutation = this.createBaseMutation<string[], { ids: string[]; categoryId: number }>({
    mutationFn: (dto) => lastValueFrom(this.http.post<string[]>(`/products/sort`, dto.ids)),
    updateCache: (old, dto) => {
      const category = old.categories?.find((x) => x.id === dto.categoryId);
      if (category?.products) {
        for (const product of category.products) {
          product.position = dto.ids.indexOf(product.id);
        }
        category.products.sort(DEFAULT_SORT_FUNC);
        old.categories = [...(old.categories || [])];
        return { ...old };
      }
      return old;
    },
  });

  saveCostMutation = this.createBaseMutation<MenuCost, Partial<MenuCost>>({
    mutationFn: (dto) => lastValueFrom(this.http.post<MenuCost>(`/menuCosts`, dto)),
    updateCache: (old, dto) => {
      if (dto.id) {
        if (old.costs) {
          const index = old.costs.findIndex((x) => x.id === dto.id);
          if (index > -1) {
            const cost = old.costs[index];
            if (cost) {
              Object.assign(cost, dto);
              old.costs[index] = { ...cost };
            }
            return { ...old };
          }
        }
      } else {
        old.costs?.unshift(dto as MenuCost);
        return { ...old };
      }
      return old;
    },
  });

  saveCategoryMutation = this.createBaseMutation<ProductCategory, Partial<ProductCategory>>({
    mutationFn: (dto) => lastValueFrom(this.http.post<ProductCategory>(`/productCategories`, dto)),
    updateCache: (old, dto) => {
      if (dto.id) {
        if (old.categories) {
          const index = old.categories.findIndex((x) => x.id === dto.id);
          if (index > -1) {
            const category = old.categories[index];
            if (category) {
              Object.assign(category, dto);
              old.categories[index] = { ...category };
            }
            return { ...old };
          }
        }
      } else {
        old.categories?.push(dto as ProductCategory);
        return { ...old };
      }
      return old;
    },
  });

  sortCategoriesMutation = this.createBaseMutation<number[], number[]>({
    mutationFn: (dto) => lastValueFrom(this.http.post<number[]>(`/productCategories/sort`, dto)),
    updateCache: (old, dto) => {
      const categories = old.categories;
      if (categories) {
        for (const category of categories) {
          category.position = dto.indexOf(category.id);
        }
        categories.sort(DEFAULT_SORT_FUNC);
        old.categories = categories;
        return { ...old };
      }
      return old;
    },
  });

  deleteCategoryMutation = this.createBaseMutation<void, number>({
    mutationFn: (id) => lastValueFrom(this.http.delete<void>(`/productCategories/${id}`)),
    updateCache: (old, id) => {
      if (old.categories) {
        old.categories = old.categories.filter(category => category.id !== id);
        return { ...old };
      }
      return old;
    },
    onSuccess: () => {
      this.snack.open(this.t.instant('app.deleted'), '', { duration: 2000 });
    },
  });

  deleteCostMutation = this.createBaseMutation<void, number>({
    mutationFn: (id) => lastValueFrom(this.http.delete<void>(`/menuCosts/${id}`)),
    updateCache: (old, id) => {
      if (old.costs) {
        old.costs = old.costs.filter(cost => cost.id !== id);
        return { ...old };
      }
      return old;
    },
    onSuccess: () => {
      this.snack.open(this.t.instant('app.deleted'), '', { duration: 2000 });
    },
  });
}
