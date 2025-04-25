import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppConfig, BusinessCategory, Shop } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { injectMutation, injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

const QUERY_KEY = ['shops'];

@Injectable({
  providedIn: 'root',
})
export class ShopService {
  readonly http = inject(HttpClient);
  readonly auth = inject(AuthService);
  readonly snack = inject(MatSnackBar);
  readonly t = inject(TranslateService);
  readonly queryClient = injectQueryClient();

  saveMutation = injectMutation(() => ({
    mutationFn: (dto: Partial<Shop>) => lastValueFrom(this.http.put<Shop>(`/shops`, dto)),
    onMutate: () => {
      this.snack.open(this.t.instant('app.saving'), '', { duration: 3000 });
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      this.snack.open(this.t.instant('app.savedSuccessfully'), '', { duration: 2000 });
    },
    onError: () => {
      this.snack.open(this.t.instant('errors.changeError'), '', { duration: 2000 });
    },
  }));

  saveAppConfigMutation = injectMutation(() => ({
    mutationFn: (dto: { appConfig: Partial<AppConfig>; shop: Partial<Shop> | null }) =>
      Promise.all([
        lastValueFrom(this.http.post<AppConfig>(`/appConfigs`, dto.appConfig)),
        dto.shop && lastValueFrom(this.http.put<Shop>(`/shops`, dto.shop)),
      ]),

    onMutate: () => {
      this.snack.open(this.t.instant('app.saving'), '', { duration: 3000 });
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      this.snack.open(this.t.instant('app.savedSuccessfully'), '', { duration: 2000 });
    },
    onError: () => {
      this.snack.open(this.t.instant('errors.changeError'), '', { duration: 2000 });
    },
  }));

  private query = injectQuery(() => ({
    queryKey: QUERY_KEY,
    queryFn: () => lastValueFrom(this.http.get<Shop>('/shops')),
    enabled: !!this.auth.userSignal(),
  }));

  data = computed(() => {
    return this.query.data();
  });

  businessCategoryTitle = computed(() => {
    return this.t.instant(`shopBusinessCategory.${this.data()?.businessCategory || BusinessCategory.Other}`);
  });

  isRestaurantOrCoffeeShop = computed(() => {
    return Shop.isRestaurantOrCoffeeShop(this.data()?.businessCategory);
  });

  businessCategoryMenuTitle = computed(() => {
    return this.t.instant(`menu.businessCategory.${this.data()?.businessCategory || BusinessCategory.Cafe}`);
  });

  appLink = computed(() => {
    const shop = this.data();
    if (shop) return Shop.appLink(shop, environment.appDomain);
    return;
  });

  businessCategoryMenuIcon = computed(() => {
    const category = this.data()?.businessCategory || BusinessCategory.Cafe;
    switch (category) {
      case BusinessCategory.Cafe:
        return 'mug-hot';
      case BusinessCategory.Restaurant:
        return 'utensils';
      case BusinessCategory.CafeRestaurant:
        return 'mug-hot';
      case BusinessCategory.Protein:
        return 'dumbbell';
      case BusinessCategory.Confectionary:
        return 'cookie';
      case BusinessCategory.GameCafe:
        return 'gamepad';
      case BusinessCategory.JuiceAndIceCream:
        return 'ice-cream';
      case BusinessCategory.Herbal:
        return 'leaf';
      case BusinessCategory.Nuts:
        return 'seedling';
      case BusinessCategory.Fruits:
        return 'apple-whole';
      case BusinessCategory.Other:
        return 'store';
      default:
        return 'store';
    }
  });
}
